const WebSocket = require('ws');
import fetch from 'node-fetch';

interface MexcWebSocket {
    removeAllListeners: () => void;
    terminate: () => void;
    on: (event: string, listener: (...args: any[]) => void) => this;
    send: (data: string) => void;
    readyState: number;
    close: () => void;
    ping: () => void;
}

interface PriceUpdate {
    identifier: string;
    symbol: string;
    type: 'spot' | 'futures';
    marketType: 'spot' | 'futures';
    bestAsk: number;
    bestBid: number;
}

export class MexcConnector {
    private ws: MexcWebSocket | null = null;
    private priceUpdateCallback: ((update: PriceUpdate) => void) | null = null;
    private readonly identifier: string = 'MEXC';
    private isConnected: boolean = false;
    private reconnectAttempts: number = 0;
    private readonly maxReconnectAttempts: number = 10;
    private readonly reconnectDelay: number = 5000;
    private readonly WS_URL = 'wss://contract.mexc.com/ws';
    private readonly REST_URL = 'https://contract.mexc.com/api/v1/contract/detail';
    private subscribedSymbols: Set<string> = new Set();
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private readonly HEARTBEAT_INTERVAL = 20000;
    private reconnectTimeout: NodeJS.Timeout | null = null;

    constructor() {
        console.log(`[${this.identifier}] Conector instanciado.`);
    }

    private startHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }

        this.heartbeatInterval = setInterval(() => {
            if (this.ws && this.isConnected) {
                try {
                    const pingMessage = { "op": "ping" };
                    this.ws.send(JSON.stringify(pingMessage));
                    console.log(`[${this.identifier}] Ping enviado`);
                } catch (error) {
                    console.error(`[${this.identifier}] Erro ao enviar ping:`, error);
                    this.handleDisconnect('Erro ao enviar ping');
                }
            }
        }, this.HEARTBEAT_INTERVAL);
    }

    private stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    private async cleanup() {
        this.stopHeartbeat();
        
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        
        if (this.ws) {
            try {
                this.ws.removeAllListeners();
                if (this.ws.readyState === WebSocket.OPEN) {
                    this.ws.close();
                } else {
                    this.ws.terminate();
                }
                this.ws = null;
            } catch (error) {
                console.error(`[${this.identifier}] Erro ao limpar conexão:`, error);
            }
        }
        
        this.isConnected = false;
    }

    private handleDisconnect(reason: string = 'Desconexão') {
        console.log(`[${this.identifier}] Desconectado: ${reason}`);
        
        this.cleanup().then(() => {
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                const delay = Math.min(this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts), 30000);
                console.log(`[${this.identifier}] Tentando reconectar em ${delay}ms... (Tentativa ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
                
                this.reconnectTimeout = setTimeout(() => {
                    this.connect().catch((error: unknown) => {
                        console.error(`[${this.identifier}] Erro na tentativa de reconexão:`, error);
                    });
                }, delay);
                
                this.reconnectAttempts++;
            } else {
                console.error(`[${this.identifier}] Número máximo de tentativas de reconexão atingido`);
            }
        });
    }

    async connect(): Promise<void> {
        try {
            await this.cleanup();
            console.log(`\n[${this.identifier}] Iniciando conexão WebSocket...`);
            
            this.ws = new WebSocket(this.WS_URL, {
                handshakeTimeout: 10000
            }) as MexcWebSocket;

            this.ws.on('open', () => {
                console.log(`[${this.identifier}] WebSocket conectado`);
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.startHeartbeat();
                this.resubscribeAll();
            });

            this.ws.on('message', (data: any) => {
                try {
                    const message = JSON.parse(data.toString());
                    
                    // Handle pong response
                    if (message.op === 'pong') {
                        console.log(`[${this.identifier}] Pong recebido`);
                        return;
                    }

                    // Handle subscription data
                    if (message.c && message.c.includes('contract.ticker')) {
                        const symbol = message.s;
                        const bestAsk = parseFloat(message.a);
                        const bestBid = parseFloat(message.b);
                        
                        if (bestAsk && bestBid && bestAsk > 0 && bestBid > 0) {
                            const update: PriceUpdate = {
                                identifier: this.identifier,
                                symbol: symbol,
                                type: 'futures',
                                marketType: 'futures',
                                bestAsk: bestAsk,
                                bestBid: bestBid
                            };

                            // Log apenas para pares prioritários
                            const priorityPairs = ['MGO_USDT', 'GNC_USDT', 'BTC_USDT', 'ETH_USDT', 'SOL_USDT', 'WHITE_USDT'];
                            if (priorityPairs.includes(symbol)) {
                                console.log(`[${this.identifier} PRICE] ${symbol}: Ask=${bestAsk}, Bid=${bestBid} | ${new Date().toLocaleTimeString()}`);
                            }

                            if (this.priceUpdateCallback) {
                                this.priceUpdateCallback(update);
                            }
                        }
                    }
                } catch (error) {
                    console.error(`[${this.identifier}] Erro ao processar mensagem:`, error);
                }
            });

            this.ws.on('close', (code: number, reason: string) => {
                console.log(`[${this.identifier}] WebSocket fechado. Código: ${code}, Razão: ${reason}`);
                this.handleDisconnect();
            });

            this.ws.on('error', (error: Error) => {
                console.error(`[${this.identifier}] Erro na conexão WebSocket:`, error);
                this.handleDisconnect();
            });

        } catch (error) {
            console.error(`[${this.identifier}] Erro ao conectar:`, error);
            this.handleDisconnect();
        }
    }

    async getTradablePairs(): Promise<string[]> {
        try {
            console.log(`[${this.identifier}] Buscando pares negociáveis...`);
            const response = await fetch(this.REST_URL);
            const data = await response.json();
            
            if (!Array.isArray(data)) {
                console.error(`[${this.identifier}] Resposta inválida:`, data);
                return [];
            }

            const pairs = data
                .filter((contract: any) => {
                    // Filtra apenas contratos ativos e que terminam em USDT
                    return contract.state === 'ENABLED' && 
                           contract.symbol.endsWith('_USDT') &&
                           contract.symbol.includes('_') &&
                           contract.symbol.split('_').length === 2;
                })
                .map((contract: any) => contract.symbol);

            console.log(`[${this.identifier}] ${pairs.length} pares encontrados`);
            if (pairs.length > 0) {
                console.log('Primeiros 5 pares:', pairs.slice(0, 5));
                console.log(`[${this.identifier}] WHITE_USDT incluído: ${pairs.includes('WHITE_USDT')}`);
            }
            return pairs;
        } catch (error) {
            console.error(`[${this.identifier}] Erro ao buscar pares:`, error);
            return [];
        }
    }

    private subscribeToSymbols() {
        if (!this.ws || !this.isConnected) {
            console.log(`[${this.identifier}] WebSocket não está conectado`);
            return;
        }

        try {
            const symbols = Array.from(this.subscribedSymbols);
            console.log(`\n[${this.identifier}] Inscrevendo-se em ${symbols.length} pares`);
            
            // Enviar subscrição para cada par individualmente
            symbols.forEach((symbol, index) => {
                const subscribeMessage = {
                    "op": "sub",
                    "symbol": symbol,
                    "channel": "contract.ticker"
                };

                if (this.ws) {
                    this.ws.send(JSON.stringify(subscribeMessage));
                }
                
                // Log apenas a cada 10 símbolos para não sobrecarregar
                if (index % 10 === 0 || index < 5 || index >= symbols.length - 5) {
                    console.log(`[${this.identifier}] Subscrição ${index + 1}/${symbols.length}: ${symbol}`);
                }
            });
            
            console.log(`[${this.identifier}] ✅ Todas as ${symbols.length} subscrições enviadas!`);
        } catch (error) {
            console.error(`[${this.identifier}] Erro ao se inscrever nos pares:`, error);
        }
    }

    private resubscribeAll() {
        const symbols = Array.from(this.subscribedSymbols);
        if (symbols.length > 0) {
            console.log(`[${this.identifier}] Reinscrevendo em ${symbols.length} pares...`);
            this.subscribeToSymbols();
        }
    }

    public disconnect(): void {
        console.log(`[${this.identifier}] Desconectando...`);
        this.cleanup();
    }

    public onPriceUpdate(callback: (update: PriceUpdate) => void): void {
        this.priceUpdateCallback = callback;
    }

         // Método para adicionar símbolos e fazer subscrição
     public async addSymbols(symbols: string[]): Promise<void> {
         symbols.forEach(symbol => this.subscribedSymbols.add(symbol));
         
         if (this.isConnected) {
             this.subscribeToSymbols();
         }
     }
} 