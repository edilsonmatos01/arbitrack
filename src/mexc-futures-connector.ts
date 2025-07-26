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
    type: string;
    symbol: string;
    marketType: string;
    bestAsk: number;
    bestBid: number;
    identifier: string;
}

export class MexcFuturesConnector {
    private ws: MexcWebSocket | null = null;
    private readonly identifier: string;
    private readonly onPriceUpdate: Function;
    private readonly onConnect: Function;
    private isConnected: boolean = false;
    private reconnectAttempts: number = 0;
    private readonly maxReconnectAttempts: number = 10;
    private readonly reconnectDelay: number = 5000;
    private readonly WS_URL = 'wss://contract.mexc.com/edge';
    private readonly REST_URL = 'https://contract.mexc.com/api/v1/contract/detail';
    private subscribedSymbols: Set<string> = new Set();
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private readonly HEARTBEAT_INTERVAL = 20000;
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private isConnecting: boolean = false;

    constructor(identifier: string, onPriceUpdate: Function, onConnect: Function) {
        this.identifier = identifier;
        this.onPriceUpdate = onPriceUpdate;
        this.onConnect = onConnect;
        console.log(`[${this.identifier}] Conector instanciado.`);
    }

    private startHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }

        this.heartbeatInterval = setInterval(() => {
            if (this.ws && this.isConnected) {
                try {
                    const pingMessage = { "method": "ping" };
                    this.ws!.send(JSON.stringify(pingMessage));
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
                            this.ws!.removeAllListeners();
            if (this.ws!.readyState === WebSocket.OPEN) {
                this.ws!.close();
            } else {
                this.ws!.terminate();
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

    async connect() {
        if (this.isConnecting) {
            console.log(`[${this.identifier}] Conexão já em andamento, aguardando...`);
            return;
        }

        this.isConnecting = true;

        try {
            await this.cleanup();
            console.log(`\n[${this.identifier}] Iniciando conexão WebSocket... (Tentativa ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
            
            this.ws = new WebSocket(this.WS_URL, {
                handshakeTimeout: 10000,
                timeout: 10000
            }) as MexcWebSocket;

            this.ws.on('open', () => {
                console.log(`[${this.identifier}] WebSocket conectado`);
                this.isConnected = true;
                this.isConnecting = false;
                this.reconnectAttempts = 0;
                this.startHeartbeat();
                this.resubscribeAll();
                this.onConnect();
            });

            this.ws.on('message', (data: any) => {
                try {
                    const message = JSON.parse(data.toString());
                    
                    // Handle pong response
                    if (message.method === 'pong') {
                        return;
                    }

                    // Handle ticker data
                    if (message.channel === 'push.ticker' && message.data) {
                        const symbol = message.data.symbol;
                        const bestAsk = parseFloat(message.data.ask1);
                        const bestBid = parseFloat(message.data.bid1);
                        
                        if (bestAsk && bestBid && bestAsk > 0 && bestBid > 0) {
                            // Log apenas para pares prioritários
                            const priorityPairs = ['BTC_USDT', 'ETH_USDT', 'SOL_USDT', 'WHITE_USDT', 'MGO_USDT'];
                            if (priorityPairs.includes(symbol)) {
                                console.log(`[${this.identifier}] ${symbol}: Ask=${bestAsk}, Bid=${bestBid}`);
                            }

                            this.onPriceUpdate({
                                type: 'price-update',
                                symbol: symbol.replace('_', '/'),
                                marketType: 'futures',
                                bestAsk: bestAsk,
                                bestBid: bestBid,
                                identifier: this.identifier
                            });
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
                console.error(`[${this.identifier}] Resposta inválida da API`);
                return [];
            }

            const pairs = data
                .filter((contract: any) => {
                    return contract.state === 'ENABLED' && 
                           contract.symbol.endsWith('_USDT') &&
                           contract.symbol.includes('_') &&
                           contract.symbol.split('_').length === 2;
                })
                .map((contract: any) => contract.symbol.replace('_', '/'));

            console.log(`[${this.identifier}] ${pairs.length} pares encontrados`);
            if (pairs.length > 0) {
                console.log(`[${this.identifier}] Primeiros 10 pares:`, pairs.slice(0, 10));
            }
            return pairs;
        } catch (error) {
            console.error(`[${this.identifier}] Erro ao buscar pares:`, error);
            // Retornar lista de fallback
            return [
                'BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'XRP/USDT', 'BNB/USDT',
                'ADA/USDT', 'AVAX/USDT', 'DOT/USDT', 'MATIC/USDT', 'LINK/USDT',
                'WHITE/USDT', 'MGO/USDT', 'GNC/USDT', 'CBK/USDT', 'FARM/USDT'
            ];
        }
    }

    subscribe(pairs: string[]) {
        if (!this.ws || !this.isConnected) {
            console.error(`[${this.identifier}] WebSocket não está conectado`);
            return;
        }

        try {
            console.log(`\n[${this.identifier}] Inscrevendo-se em ${pairs.length} pares`);
            
            // Converte os pares para o formato do MEXC (BTC/USDT -> BTC_USDT)
            const formattedPairs = pairs.map(pair => pair.replace('/', '_'));
            
            // Enviar subscrição em lotes para evitar sobrecarga
            const batchSize = 20;
            for (let i = 0; i < formattedPairs.length; i += batchSize) {
                const batch = formattedPairs.slice(i, i + batchSize);
                
                setTimeout(() => {
                    if (this.ws && this.isConnected) {
                        batch.forEach((symbol) => {
                            const subscribeMessage = {
                                method: "sub.ticker",
                                param: { symbol: symbol }
                            };

                            this.ws!.send(JSON.stringify(subscribeMessage));
                        });
                        
                        console.log(`[${this.identifier}] Lote ${Math.floor(i/batchSize) + 1}: ${batch.length} símbolos enviados`);
                    }
                }, i * 200); // Delay de 200ms entre lotes
            }
            
            pairs.forEach(symbol => this.subscribedSymbols.add(symbol));
            console.log(`[${this.identifier}] ✅ Todas as ${pairs.length} subscrições agendadas!`);
        } catch (error) {
            console.error(`[${this.identifier}] Erro ao se inscrever nos pares:`, error);
        }
    }

    private resubscribeAll() {
        const symbols = Array.from(this.subscribedSymbols);
        if (symbols.length > 0) {
            console.log(`[${this.identifier}] Reinscrevendo em ${symbols.length} pares...`);
            this.subscribe(symbols);
        }
    }

    // Método público para desconectar
    public disconnect() {
        console.log(`[${this.identifier}] Desconectando...`);
        this.cleanup();
    }
} 