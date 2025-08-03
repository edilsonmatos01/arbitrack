"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GateioConnector = void 0;
const ws_1 = __importDefault(require("ws"));
class GateioConnector {
    constructor() {
        this.ws = null;
        this.priceUpdateCallback = null;
        this.wsUrl = 'wss://api.gateio.ws/ws/v4/';
        this.restUrl = 'https://api.gateio.ws/api/v4/spot/currency_pairs';
        this.symbols = [];
        this.pingInterval = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }
    async connect() {
        try {
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                console.log('[GATEIO] Máximo de tentativas atingido, aguardando 1 minuto...');
                this.reconnectAttempts = 0;
                setTimeout(() => this.connect(), 60000);
                return;
            }
            console.log('[GATEIO CONNECT] Iniciando conexão SPOT...');
            this.symbols = await this.getSpotSymbols();
            console.log(`[GATEIO CONNECT] ${this.symbols.length} símbolos SPOT obtidos`);
            this.ws = new ws_1.default(this.wsUrl, {
                handshakeTimeout: 30000,
                perMessageDeflate: false,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            this.ws.on('open', () => {
                console.log('[GATEIO CONNECT] ✅ Conexão SPOT estabelecida!');
                this.reconnectAttempts = 0;
                this.setupHeartbeat();
                this.subscribeToSpotSymbols();
            });
            this.ws.on('message', (data) => this.handleMessage(data));
            this.ws.on('error', (error) => {
                console.error('[GATEIO ERROR] Erro na conexão:', error);
                this.cleanup();
                this.reconnectAttempts++;
                setTimeout(() => this.connect(), 5000);
            });
            this.ws.on('close', (code, reason) => {
                console.log(`[GATEIO CLOSE] Conexão fechada: ${code} ${reason === null || reason === void 0 ? void 0 : reason.toString()}`);
                this.cleanup();
                this.reconnectAttempts++;
                setTimeout(() => this.connect(), 5000);
            });
        }
        catch (error) {
            console.error('[GATEIO ERROR] Erro ao conectar:', error);
            this.reconnectAttempts++;
            setTimeout(() => this.connect(), 5000);
        }
    }
    async getSpotSymbols() {
        try {
            const predefinedPairs = [
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
            console.log(`[GATEIO API] ✅ Usando lista pré-definida: ${predefinedPairs.length} pares`);
            console.log(`[GATEIO API] Primeiros 5: ${predefinedPairs.slice(0, 5).join(', ')}`);
            return predefinedPairs;
        }
        catch (error) {
            console.error('[GATEIO API] Erro ao obter símbolos:', error);
            return [
                'BTC_USDT',
                'ETH_USDT',
                'SOL_USDT',
                'XRP_USDT',
                'BNB_USDT'
            ];
        }
    }
    setupHeartbeat() {
        var _a;
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
        }
        this.pingInterval = setInterval(() => {
            var _a;
            if (((_a = this.ws) === null || _a === void 0 ? void 0 : _a.readyState) === ws_1.default.OPEN) {
                this.ws.ping();
            }
        }, 30000);
        (_a = this.ws) === null || _a === void 0 ? void 0 : _a.on('pong', () => {
        });
    }
    subscribeToSpotSymbols() {
        console.log(`[GATEIO SUB] Iniciando subscrições SPOT para ${this.symbols.length} símbolos`);
        this.symbols.forEach((symbol, index) => {
            var _a;
            if (((_a = this.ws) === null || _a === void 0 ? void 0 : _a.readyState) === ws_1.default.OPEN) {
                const msg = {
                    time: Math.floor(Date.now() / 1000),
                    channel: "spot.tickers",
                    event: "subscribe",
                    payload: [symbol]
                };
                if (index % 100 === 0 || index < 5 || index >= this.symbols.length - 5) {
                    console.log(`[GATEIO SUB] (${index + 1}/${this.symbols.length}) ${symbol}`);
                }
                this.ws.send(JSON.stringify(msg));
                if (index < this.symbols.length - 1) {
                    setTimeout(() => { }, 10);
                }
            }
        });
        console.log(`[GATEIO SUB] ✅ Todas as ${this.symbols.length} subscrições SPOT enviadas!`);
    }
    handleMessage(data) {
        try {
            const message = JSON.parse(data.toString());
            if (message.event) {
                if (message.event === 'subscribe') {
                    console.log(`[GATEIO EVENT] Subscrição confirmada para canal: ${message.channel}`);
                }
                else if (message.event === 'update' && message.result) {
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
                            const priorityPairs = ['MGO_USDT', 'GNC_USDT', 'BTC_USDT', 'ETH_USDT', 'SOL_USDT'];
                            if (priorityPairs.includes(symbol)) {
                                console.log(`[GATEIO PRICE] ${symbol}: Ask=${bestAsk}, Bid=${bestBid} | ${new Date().toLocaleTimeString()}`);
                            }
                            this.priceUpdateCallback(update);
                        }
                        else {
                            console.log(`[GATEIO SKIP] ${symbol}: Ask=${bestAsk}, Bid=${bestBid} (dados inválidos)`);
                        }
                    }
                }
                else if (message.error) {
                    console.log(`[GATEIO ERROR] ${message.event}: ${JSON.stringify(message.error)}`);
                }
                return;
            }
            if (message.channel && !message.event) {
                console.log(`[GATEIO DEBUG] Canal ${message.channel} - Tipo: ${typeof message.result}`);
            }
        }
        catch (error) {
            console.error('[GATEIO ERROR] Erro ao processar mensagem:', error);
            console.error('[GATEIO ERROR] Dados brutos:', data.toString().substring(0, 200));
        }
    }
    disconnect() {
        console.log('[GATEIO DISCONNECT] Desconectando...');
        this.cleanup();
    }
    cleanup() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
        if (this.ws) {
            this.ws.removeAllListeners();
            if (this.ws.readyState === ws_1.default.OPEN) {
                this.ws.close();
            }
            this.ws = null;
        }
    }
    onPriceUpdate(callback) {
        this.priceUpdateCallback = callback;
    }
}
exports.GateioConnector = GateioConnector;
//# sourceMappingURL=gateio-connector.js.map