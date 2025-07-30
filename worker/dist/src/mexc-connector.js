"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MexcConnector = void 0;
const ws_1 = __importDefault(require("ws"));
class MexcConnector {
    constructor() {
        this.ws = null;
        this.priceUpdateCallback = null;
        this.wsUrl = 'wss://contract.mexc.com/edge';
        this.restUrl = 'https://contract.mexc.com/api/v1/contract/detail';
        this.symbols = [];
        this.pingInterval = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectDelay = 5000;
        this.relevantPairs = [
            'BTC_USDT',
            'ETH_USDT',
            'SOL_USDT',
            'XRP_USDT',
            'BNB_USDT'
        ];
    }
    async connect() {
        try {
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                console.error('Número máximo de tentativas de reconexão atingido. Aguardando 1 minuto antes de tentar novamente.');
                this.reconnectAttempts = 0;
                setTimeout(() => this.connect(), 60000);
                return;
            }
            this.symbols = await this.getSymbols();
            console.log('Conectando ao WebSocket da MEXC...');
            this.ws = new ws_1.default(this.wsUrl, {
                perMessageDeflate: false,
                handshakeTimeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    'Origin': 'https://contract.mexc.com'
                }
            });
            this.ws.on('open', () => {
                console.log('Conexão estabelecida com MEXC!');
                this.reconnectAttempts = 0;
                this.setupHeartbeat();
                this.subscribeToSymbols();
            });
            this.ws.on('message', (data) => this.handleMessage(data));
            this.ws.on('error', (error) => {
                console.error('Erro na conexão MEXC:', error);
                this.cleanup();
                this.reconnectAttempts++;
                setTimeout(() => this.connect(), this.reconnectDelay);
            });
            this.ws.on('close', (code, reason) => {
                console.log('Conexão MEXC fechada:', code, reason?.toString());
                this.cleanup();
                this.reconnectAttempts++;
                setTimeout(() => this.connect(), this.reconnectDelay);
            });
            this.ws.on('pong', () => {
                if (this.ws) {
                    this.ws.isAlive = true;
                    console.log('Pong recebido da MEXC - Conexão ativa');
                }
            });
        }
        catch (error) {
            console.error('Erro ao conectar com MEXC:', error);
            this.reconnectAttempts++;
            setTimeout(() => this.connect(), this.reconnectDelay);
        }
    }
    async getSymbols() {
        try {
            // Usar apenas a lista pré-definida para otimizar performance
            const predefinedPairs = [
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
            console.log(`[MEXC API] ✅ Usando lista pré-definida: ${predefinedPairs.length} pares`);
            console.log(`[MEXC API] Primeiros 5: ${predefinedPairs.slice(0, 5).join(', ')}`);
            return predefinedPairs;
        }
        catch (error) {
            console.error('[MEXC API] Erro ao obter símbolos:', error);
            return this.relevantPairs;
        }
    }
    setupHeartbeat() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
        }
        this.pingInterval = setInterval(() => {
            if (this.ws?.readyState === ws_1.default.OPEN) {
                if (this.ws.isAlive === false) {
                    console.log('MEXC não respondeu ao ping anterior, reconectando...');
                    this.cleanup();
                    this.connect();
                    return;
                }
                this.ws.isAlive = false;
                const pingMsg = {
                    "method": "ping"
                };
                this.ws.send(JSON.stringify(pingMsg));
                console.log('Ping enviado para MEXC');
            }
        }, 10000);
    }
    subscribeToSymbols() {
        if (!this.ws || this.ws.readyState !== ws_1.default.OPEN) {
            console.log('WebSocket não está pronto para subscrição, tentando reconectar...');
            this.cleanup();
            this.connect();
            return;
        }
        console.log(`[MEXC SUB] Iniciando subscrições para ${this.symbols.length} símbolos`);
        this.symbols.forEach((symbol, index) => {
            // Usar o símbolo EXATO da API (não converter formato)
            const msg = {
                "method": "sub.ticker",
                "param": {
                    "symbol": symbol // Usar símbolo exato da API
                }
            };
            try {
                // Log apenas os primeiros 5 e últimos 5 para não sobrecarregar
                if (index < 5 || index >= this.symbols.length - 5) {
                    console.log(`[MEXC SUB] (${index + 1}/${this.symbols.length}) ${symbol}:`, JSON.stringify(msg));
                }
                this.ws?.send(JSON.stringify(msg));
            }
            catch (error) {
                console.error('Erro ao enviar subscrição para MEXC:', error);
            }
        });
        console.log(`[MEXC SUB] ✅ Todas as ${this.symbols.length} subscrições enviadas!`);
    }
    handleMessage(data) {
        try {
            const message = JSON.parse(data.toString());
            // Responde ao ping do servidor
            if (message.method === "ping") {
                const pongMsg = {
                    "method": "pong"
                };
                this.ws?.send(JSON.stringify(pongMsg));
                console.log(`[MEXC] Respondeu ping do servidor`);
                return;
            }
            // Log de confirmação de subscrições
            if (message.id && message.result) {
                console.log(`[MEXC] Subscrição confirmada - ID: ${message.id}, Result: ${message.result}`);
                return;
            }
            // Processa mensagens de ticker (formato correto)
            if (message.channel === "push.ticker" && message.data) {
                const ticker = message.data;
                const bestAsk = parseFloat(ticker.ask1);
                const bestBid = parseFloat(ticker.bid1);
                if (bestAsk && bestBid && this.priceUpdateCallback) {
                    // Converter formato do símbolo: BTC_USDT -> BTC_USDT (manter formato padrão)
                    const symbol = ticker.symbol;
                    const update = {
                        identifier: 'mexc',
                        symbol: symbol,
                        type: 'futures',
                        marketType: 'futures',
                        bestAsk,
                        bestBid
                    };
                    // Log apenas para pares prioritários para reduzir verbosidade
                    if (this.relevantPairs.includes(symbol)) {
                        console.log(`[MEXC PRICE] ${symbol}: Ask=${bestAsk}, Bid=${bestBid}`);
                    }
                    this.priceUpdateCallback(update);
                }
                else {
                    console.log(`[MEXC] Dados de ticker inválidos - Symbol: ${ticker.symbol}, Ask: ${bestAsk}, Bid: ${bestBid}`);
                }
            }
            else {
                // Log de outros tipos de mensagem (apenas erros importantes)
                if (message.channel && message.channel.startsWith('rs.error')) {
                    console.log(`[MEXC ERROR] ${message.data}`);
                }
                else if (message.error) {
                    console.log(`[MEXC ERROR] Erro recebido:`, JSON.stringify(message.error));
                }
                else {
                    // Log detalhado apenas para debug quando necessário
                    console.log(`[MEXC DEBUG] Mensagem não processada - Channel: ${message.channel || 'N/A'}, Method: ${message.method || 'N/A'}`);
                }
            }
        }
        catch (error) {
            console.error('[MEXC ERROR] Erro ao processar mensagem:', error);
            console.error('[MEXC ERROR] Dados brutos:', data.toString().substring(0, 200));
        }
    }
    disconnect() {
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
exports.MexcConnector = MexcConnector;
