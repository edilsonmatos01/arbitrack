const WebSocket = require('ws');
const fetch = require('node-fetch');

class MexcFuturesConnector {
    constructor(identifier, onPriceUpdate, onConnect) {
        this.identifier = identifier;
        this.onPriceUpdate = onPriceUpdate;
        this.onConnect = onConnect;
        this.ws = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectDelay = 5000;
        this.WS_URL = 'wss://contract.mexc.com/edge';
        this.REST_URL = 'https://contract.mexc.com/api/v1/contract/detail';
        this.subscribedSymbols = new Set();
        this.heartbeatInterval = null;
        this.HEARTBEAT_INTERVAL = 20000;
        this.reconnectTimeout = null;
        this.isConnecting = false;
        
        console.log(`[${this.identifier}] Conector MEXC Futures instanciado.`);
    }

    startHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }

        this.heartbeatInterval = setInterval(() => {
            if (this.ws && this.isConnected) {
                try {
                    const pingMessage = { "method": "ping" };
                    this.ws.send(JSON.stringify(pingMessage));
                    console.log(`[${this.identifier}] Ping enviado`);
                } catch (error) {
                    console.error(`[${this.identifier}] Erro ao enviar ping:`, error);
                    this.handleDisconnect('Erro ao enviar ping');
                }
            }
        }, this.HEARTBEAT_INTERVAL);
    }

    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    async cleanup() {
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

    handleDisconnect(reason = 'Desconexão') {
        console.log(`[${this.identifier}] Desconectado: ${reason}`);
        
        this.cleanup().then(() => {
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                const delay = Math.min(this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts), 30000);
                console.log(`[${this.identifier}] Tentando reconectar em ${delay}ms... (Tentativa ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
                
                this.reconnectTimeout = setTimeout(() => {
                    this.connect().catch((error) => {
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
                handshakeTimeout: 15000,
                timeout: 15000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            this.ws.on('open', () => {
                console.log(`[${this.identifier}] WebSocket conectado`);
                this.isConnected = true;
                this.isConnecting = false;
                this.reconnectAttempts = 0;
                this.startHeartbeat();
                this.resubscribeAll();
                this.onConnect();
            });

            this.ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    
                    // Log para debug
                    console.log(`[${this.identifier}] Mensagem recebida:`, JSON.stringify(message).substring(0, 200));
                    
                    // Handle pong response
                    if (message.method === 'pong') {
                        console.log(`[${this.identifier}] Pong recebido`);
                        return;
                    }

                    // Handle subscription confirmation
                    if (message.channel === 'rs.sub.ticker' && message.data === 'success') {
                        console.log(`[${this.identifier}] Subscrição confirmada`);
                        return;
                    }

                    // Handle ticker data - CORREÇÃO: usar o formato correto
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

            this.ws.on('close', (code, reason) => {
                console.log(`[${this.identifier}] WebSocket fechado. Código: ${code}, Razão: ${reason}`);
                this.handleDisconnect();
            });

            this.ws.on('error', (error) => {
                console.error(`[${this.identifier}] Erro na conexão WebSocket:`, error);
                this.handleDisconnect();
            });

        } catch (error) {
            console.error(`[${this.identifier}] Erro ao conectar:`, error);
            this.handleDisconnect();
        }
    }

    async getTradablePairs() {
        try {
            console.log(`[${this.identifier}] Buscando pares negociáveis...`);
            const response = await fetch(this.REST_URL);
            const data = await response.json();
            
            // CORREÇÃO: A API MEXC retorna {success: true, code: 0, data: [...]}
            let contracts = [];
            if (data && data.success && data.data && Array.isArray(data.data)) {
                contracts = data.data;
                console.log(`[${this.identifier}] ✅ API retornou ${contracts.length} contratos`);
            } else if (Array.isArray(data)) {
                contracts = data;
                console.log(`[${this.identifier}] ✅ API retornou array direto com ${contracts.length} contratos`);
            } else {
                console.error(`[${this.identifier}] ❌ Resposta inválida da API:`, JSON.stringify(data).substring(0, 200));
                return [];
            }

            const pairs = contracts
                .filter((contract) => {
                    return contract.state === 0 && // 0 = ENABLED, 1 = DISABLED
                           contract.symbol && 
                           contract.symbol.endsWith('_USDT') &&
                           contract.symbol.includes('_') &&
                           contract.symbol.split('_').length === 2;
                })
                .map((contract) => contract.symbol.replace('_', '/'));

            console.log(`[${this.identifier}] ✅ ${pairs.length} pares USDT ativos encontrados`);
            if (pairs.length > 0) {
                console.log(`[${this.identifier}] 📊 Primeiros 10 pares:`, pairs.slice(0, 10));
            }
            return pairs;
        } catch (error) {
            console.error(`[${this.identifier}] ❌ Erro ao buscar pares:`, error);
            // Retornar lista de fallback
            return [
                'BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'XRP/USDT', 'BNB/USDT',
                'ADA/USDT', 'AVAX/USDT', 'DOT/USDT', 'MATIC/USDT', 'LINK/USDT',
                'WHITE/USDT', 'MGO/USDT', 'GNC/USDT', 'CBK/USDT', 'FARM/USDT'
            ];
        }
    }

    subscribe(pairs) {
        if (!this.ws || !this.isConnected) {
            console.error(`[${this.identifier}] WebSocket não está conectado`);
            return;
        }

        try {
            console.log(`\n[${this.identifier}] Inscrevendo-se em ${pairs.length} pares`);
            
            // Converte os pares para o formato do MEXC (BTC/USDT -> BTC_USDT)
            const formattedPairs = pairs.map(pair => pair.replace('/', '_'));
            
            // Enviar subscrição em lotes para evitar sobrecarga
            const batchSize = 10; // Reduzido para evitar sobrecarga
            for (let i = 0; i < formattedPairs.length; i += batchSize) {
                const batch = formattedPairs.slice(i, i + batchSize);
                
                setTimeout(() => {
                    if (this.ws && this.isConnected) {
                        batch.forEach((symbol) => {
                            const subscribeMessage = {
                                method: "sub.ticker",
                                param: { symbol: symbol }
                            };

                            this.ws.send(JSON.stringify(subscribeMessage));
                            console.log(`[${this.identifier}] Subscrição enviada para ${symbol}`);
                        });
                        
                        console.log(`[${this.identifier}] Lote ${Math.floor(i/batchSize) + 1}: ${batch.length} símbolos enviados`);
                    }
                }, i * 500); // Aumentado delay para 500ms entre lotes
            }
            
            pairs.forEach(symbol => this.subscribedSymbols.add(symbol));
            console.log(`[${this.identifier}] ✅ Todas as ${pairs.length} subscrições agendadas!`);
        } catch (error) {
            console.error(`[${this.identifier}] Erro ao se inscrever nos pares:`, error);
        }
    }

    resubscribeAll() {
        const symbols = Array.from(this.subscribedSymbols);
        if (symbols.length > 0) {
            console.log(`[${this.identifier}] Reinscrevendo em ${symbols.length} pares...`);
            this.subscribe(symbols);
        }
    }

    // Método público para desconectar
    disconnect() {
        console.log(`[${this.identifier}] Desconectando...`);
        this.cleanup();
    }
}

module.exports = { MexcFuturesConnector }; 