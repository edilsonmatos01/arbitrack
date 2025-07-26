const WebSocket = require('ws');
const fetch = require('node-fetch');

/**
 * Conector para Gate.io SPOT (não futures)
 * Usado para a estratégia: Comprar Gate.io Spot -> Vender MEXC Futures
 */
class GateioConnector {
    constructor() {
        this.ws = null;
        this.priceUpdateCallback = null;
        this.wsUrl = 'wss://api.gateio.ws/ws/v4/';
        this.restUrl = 'https://api.gateio.ws/api/v4/spot/currency_pairs';
        this.symbols = [];
        this.pingInterval = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.isConnecting = false;
        this.reconnectTimeout = null;
    }

    async connect() {
        if (this.isConnecting) {
            console.log('[GATEIO] Conexão já em andamento, aguardando...');
            return;
        }

        this.isConnecting = true;

        try {
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                console.log('[GATEIO] Máximo de tentativas atingido, aguardando 2 minutos...');
                this.reconnectAttempts = 0;
                setTimeout(() => {
                    this.isConnecting = false;
                    this.connect();
                }, 120000);
                return;
            }

            console.log(`[GATEIO CONNECT] Iniciando conexão SPOT... (Tentativa ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
            
            // Limpar conexão anterior
            this.cleanup();
            
            // Obter símbolos se ainda não temos
            if (this.symbols.length === 0) {
                this.symbols = await this.getSpotSymbols();
                console.log(`[GATEIO CONNECT] ${this.symbols.length} símbolos SPOT obtidos`);
            }
            
            this.ws = new WebSocket(this.wsUrl, {
                handshakeTimeout: 30000,
                perMessageDeflate: false,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            this.ws.on('open', () => {
                console.log('[GATEIO CONNECT] ✅ Conexão SPOT estabelecida!');
                this.reconnectAttempts = 0;
                this.isConnecting = false;
                this.setupHeartbeat();
                this.subscribeToSpotSymbols();
            });

            this.ws.on('message', (data) => this.handleMessage(data));
            
            this.ws.on('error', (error) => {
                console.error('[GATEIO ERROR] Erro na conexão:', error);
                this.handleReconnect('Erro na conexão');
            });

            this.ws.on('close', (code, reason) => {
                console.log(`[GATEIO CLOSE] Conexão fechada: ${code} ${reason?.toString()}`);
                this.handleReconnect('Conexão fechada');
            });

        } catch (error) {
            console.error('[GATEIO ERROR] Erro ao conectar:', error);
            this.handleReconnect('Erro ao conectar');
        }
    }

    handleReconnect(reason) {
        this.cleanup();
        this.isConnecting = false;
        this.reconnectAttempts++;
        
        const delay = Math.min(5000 * Math.pow(1.5, this.reconnectAttempts - 1), 30000);
        console.log(`[GATEIO] Tentando reconectar em ${delay}ms... (${reason})`);
        
        this.reconnectTimeout = setTimeout(() => {
            this.connect();
        }, delay);
    }

    async getSpotSymbols() {
        try {
            const priorityPairs = [
                '1DOLLAR_USDT', 'ACA_USDT', 'ACE_USDT', 'ACS_USDT', 'ACT_USDT', 'AEVO_USDT', 'AGLD_USDT', 'AIC_USDT', 'ALU_USDT', 'ANON_USDT',
                'APX_USDT', 'ARKM_USDT', 'AR_USDT', 'AUCTION_USDT', 'B2_USDT', 'BLUR_USDT', 'BLZ_USDT', 'BOOP_USDT', 'BOTIFY_USDT', 'BOXCAT_USDT',
                'BRISE_USDT', 'BR_USDT', 'BUBB_USDT', 'CBK_USDT', 'CHESS_USDT', 'CKB_USDT', 'CPOOL_USDT', 'DADDY_USDT', 'DAG_USDT', 'DEGEN_USDT',
                'DEAI_USDT', 'DODO_USDT', 'DEVVE_USDT', 'DOGINME_USDT', 'BTC_USDT', 'G7_USDT', 'NAKA_USDT', 'VR_USDT', 'WMTX_USDT', 'PIN_USDT',
                'WILD_USDT', 'BFTOKEN_USDT', 'VELAAI_USDT', 'GEAR_USDT', 'GNC_USDT', 'SUPRA_USDT', 'MAGA_USDT', 'TARA_USDT', 'BERT_USDT',
                'AO_USDT', 'EDGE_USDT', 'FARM_USDT', 'VVAIFU_USDT', 'PEPECOIN_USDT', 'TREAT_USDT', 'ALPACA_USDT', 'RBNT_USDT', 'TOMI_USDT',
                'LUCE_USDT', 'WAXP_USDT', 'NAVX_USDT', 'WHITE_USDT', 'RIFSOL_USDT', 'ALCX_USDT', 'GORK_USDT', 'ALPINE_USDT', 'CITY_USDT',
                'ILV_USDT', 'CATTON_USDT', 'ORAI_USDT', 'HOLD_USDT', 'SYS_USDT', 'POND_USDT', 'SPEC_USDT', 'LAVA_USDT', 'MAT_USDT',
                'LUNAI_USDT', 'MORE_USDT', 'MGO_USDT', 'GROK_USDT'
            ];
            console.log(`[GATEIO API] ✅ Usando lista pré-definida: ${priorityPairs.length} pares`);
            return priorityPairs;
        } catch (error) {
            console.error(`[GATEIO API] ❌ Erro ao obter símbolos:`, error);
            return [];
        }
    }

    setupHeartbeat() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
        }

        this.pingInterval = setInterval(() => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                try {
                    this.ws.ping();
                } catch (error) {
                    console.error('[GATEIO] Erro ao enviar ping:', error);
                    this.handleReconnect('Erro no ping');
                }
            }
        }, 30000);

        this.ws?.on('pong', () => {
            // Conexão está viva
        });
    }

    subscribeToSpotSymbols() {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.error('[GATEIO SUB] WebSocket não está conectado');
            return;
        }

        console.log(`[GATEIO SUB] Iniciando subscrições SPOT para ${this.symbols.length} símbolos`);
        
        // Enviar subscrição em lotes para evitar sobrecarga
        const batchSize = 50;
        for (let i = 0; i < this.symbols.length; i += batchSize) {
            const batch = this.symbols.slice(i, i + batchSize);
            
            setTimeout(() => {
                if (this.ws?.readyState === WebSocket.OPEN) {
                    const msg = {
                        time: Math.floor(Date.now() / 1000),
                        channel: "spot.tickers",
                        event: "subscribe",
                        payload: batch
                    };
                    
                    console.log(`[GATEIO SUB] Lote ${Math.floor(i/batchSize) + 1}: ${batch.length} símbolos`);
                    this.ws.send(JSON.stringify(msg));
                }
            }, i * 100); // Delay de 100ms entre lotes
        }
        
        console.log(`[GATEIO SUB] ✅ Todas as subscrições SPOT agendadas!`);
    }

    handleMessage(data) {
        try {
            const message = JSON.parse(data.toString());
            
            // Log apenas eventos importantes de subscrição
            if (message.event) {
                if (message.event === 'subscribe') {
                    console.log(`[GATEIO EVENT] Subscrição confirmada para canal: ${message.channel}`);
                } else if (message.event === 'update' && message.result) {
                    // Processar dados de ticker SPOT
                    if (message.channel === 'spot.tickers') {
                        const ticker = message.result;
                        const symbol = ticker.currency_pair;
                        const bestAsk = parseFloat(ticker.lowest_ask);
                        const bestBid = parseFloat(ticker.highest_bid);
                        
                        if (bestAsk && bestBid && bestAsk > 0 && bestBid > 0 && this.priceUpdateCallback) {
                            const update = {
                                identifier: 'gateio',
                                symbol: symbol,
                                type: 'spot',
                                marketType: 'spot',
                                bestAsk,
                                bestBid
                            };
                            
                            // Log apenas para pares prioritários
                            const priorityPairs = ['BTC_USDT', 'ETH_USDT', 'SOL_USDT', 'WHITE_USDT', 'MGO_USDT'];
                            if (priorityPairs.includes(symbol)) {
                                console.log(`[GATEIO PRICE] ${symbol}: Ask=${bestAsk}, Bid=${bestBid}`);
                            }
                            
                            this.priceUpdateCallback(update);
                        }
                    }
                } else if (message.error) {
                    console.error(`[GATEIO ERROR] ${message.event}: ${JSON.stringify(message.error)}`);
                }
                return;
            }
            
        } catch (error) {
            console.error('[GATEIO ERROR] Erro ao processar mensagem:', error);
        }
    }

    disconnect() {
        console.log('[GATEIO DISCONNECT] Desconectando...');
        this.cleanup();
    }

    cleanup() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
        
        if (this.ws) {
            this.ws.removeAllListeners();
            if (this.ws.readyState === WebSocket.OPEN) {
                this.ws.close();
            }
            this.ws = null;
        }
    }

    onPriceUpdate(callback) {
        this.priceUpdateCallback = callback;
    }
}

module.exports = { GateioConnector }; 