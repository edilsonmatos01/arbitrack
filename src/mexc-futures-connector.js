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
                    
                    // Handle pong response
                    if (message.method === 'pong') {
                        return;
                    }

                    // Handle subscription confirmation
                    if (message.channel === 'rs.sub.ticker' && message.data === 'success') {
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
            const priorityPairs = [
                '1DOLLAR_USDT', 'ACA_USDT', 'ACE_USDT', 'ACS_USDT', 'ACT_USDT', 'AEVO_USDT', 'AGLD_USDT', 'AIC_USDT', 'ALU_USDT', 'ANON_USDT',
                'APX_USDT', 'ARKM_USDT', 'AR_USDT', 'AUCTION_USDT', 'B2_USDT', 'BLUR_USDT', 'BLZ_USDT', 'BOOP_USDT', 'BOTIFY_USDT', 'BOXCAT_USDT',
                'BRISE_USDT', 'BR_USDT', 'BUBB_USDT', 'CBK_USDT', 'CHESS_USDT', 'CKB_USDT', 'CPOOL_USDT', 'CUDIS_USDT', 'DADDY_USDT', 'DAG_USDT',
                'DEGEN_USDT', 'DEAI_USDT', 'DODO_USDT', 'DEVVE_USDT', 'DOGINME_USDT', 'ENJ_USDT', 'BTC_USDT', 'G7_USDT', 'NAKA_USDT', 'VR_USDT',
                'WMTX_USDT', 'PIN_USDT', 'WILD_USDT', 'BFTOKEN_USDT', 'VELAAI_USDT', 'GEAR_USDT', 'GNC_USDT', 'SUPRA_USDT', 'MAGA_USDT',
                'TARA_USDT', 'BERT_USDT', 'AO_USDT', 'EDGE_USDT', 'FARM_USDT', 'VVAIFU_USDT', 'PEPECOIN_USDT', 'TREAT_USDT', 'ALPACA_USDT',
                'RBNT_USDT', 'TOMI_USDT', 'LUCE_USDT', 'WAXP_USDT', 'NAVX_USDT', 'WHITE_USDT', 'RIFSOL_USDT', 'ALCX_USDT', 'GORK_USDT',
                'ALPINE_USDT', 'CITY_USDT', 'ILV_USDT', 'CATTON_USDT', 'ORAI_USDT', 'HOLD_USDT', 'ALICE_USDT', 'SYS_USDT', 'PSG_USDT',
                'POND_USDT', 'SPEC_USDT', 'LAVA_USDT', 'MAT_USDT', 'REX_USDT', 'LUNAI_USDT', 'MORE_USDT', 'B_USDT', 'RED_USDT', 'GTC_USDT',
                'TALE_USDT', 'RWA_USDT', 'MGO_USDT', 'CESS_USDT', 'QUBIC_USDT', 'TEL_USDT', 'SHM_USDT', 'DOLO_USDT', 'LABUBU_USDT',
                'ZIG_USDT', 'BAR_USDT', 'GROK_USDT', 'MASA_USDT', 'XEM_USDT', 'ULTI_USDT', 'LUMIA_USDT', 'PONKE_USDT'
            ];
            
            // Converter para formato MEXC (substituir _ por /)
            const pairs = priorityPairs.map(pair => pair.replace('_', '/'));
            
            console.log(`[${this.identifier}] ✅ Usando lista pré-definida: ${pairs.length} pares`);
            return pairs;
        } catch (error) {
            console.error(`[${this.identifier}] ❌ Erro ao obter pares:`, error);
            return [];
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