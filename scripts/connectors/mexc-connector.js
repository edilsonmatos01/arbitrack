"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MexcConnector = void 0;
var ws_1 = require("ws");
var node_fetch_1 = require("node-fetch");
var events_1 = require("events");
var MEXC_SPOT_WS_URL = 'wss://wbs.mexc.com/ws';
var MexcConnector = /** @class */ (function (_super) {
    __extends(MexcConnector, _super);
    function MexcConnector(identifier, priceUpdateCallback, onConnected) {
        var _this = _super.call(this) || this;
        _this.ws = null;
        _this.subscriptions = new Set();
        _this.pingInterval = null;
        _this.isConnected = false;
        _this.REST_URL = 'https://api.mexc.com/api/v3/exchangeInfo';
        _this.marketIdentifier = identifier;
        _this.priceUpdateCallback = priceUpdateCallback;
        _this.onConnectedCallback = onConnected;
        _this.identifier = identifier;
        console.log("[".concat(_this.marketIdentifier, "] Conector instanciado."));
        return _this;
    }
    MexcConnector.prototype.connect = function () {
        var _this = this;
        if (this.ws) {
            console.log("[".concat(this.marketIdentifier, "] Fechando conex\u00E3o existente..."));
            this.ws.close();
        }
        console.log("[".concat(this.marketIdentifier, "] Conectando a ").concat(MEXC_SPOT_WS_URL));
        this.ws = new ws_1.default(MEXC_SPOT_WS_URL, {
            handshakeTimeout: 30000,
            timeout: 30000,
            perMessageDeflate: false,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        this.ws.on('open', this.onOpen.bind(this));
        this.ws.on('message', this.onMessage.bind(this));
        this.ws.on('close', this.onClose.bind(this));
        this.ws.on('error', this.onError.bind(this));
        this.ws.on('upgrade', function (response) {
            console.log("[".concat(_this.marketIdentifier, "] Conex\u00E3o WebSocket atualizada. Status:"), response.statusCode);
        });
    };
    MexcConnector.prototype.subscribe = function (symbols) {
        var _this = this;
        console.log("[".concat(this.marketIdentifier, "] Inscrevendo nos s\u00EDmbolos:"), symbols);
        symbols.forEach(function (symbol) { return _this.subscriptions.add(symbol); });
        if (this.isConnected) {
            this.sendSubscriptionRequests(Array.from(this.subscriptions));
        }
    };
    MexcConnector.prototype.onOpen = function () {
        console.log("[".concat(this.marketIdentifier, "] Conex\u00E3o WebSocket estabelecida."));
        this.isConnected = true;
        this.startPing();
        if (this.subscriptions.size > 0) {
            this.sendSubscriptionRequests(Array.from(this.subscriptions));
        }
        if (this.onConnectedCallback) {
            this.onConnectedCallback();
            this.onConnectedCallback = null;
        }
    };
    MexcConnector.prototype.sendSubscriptionRequests = function (symbols) {
        var _this = this;
        var ws = this.ws;
        if (!ws)
            return;
        symbols.forEach(function (symbol) {
            var formattedSymbol = symbol.replace('/', '').toLowerCase();
            var msg = { method: 'sub.ticker', param: { symbol: formattedSymbol } };
            console.log("[".concat(_this.marketIdentifier, "] Enviando subscri\u00E7\u00E3o:"), JSON.stringify(msg));
            ws.send(JSON.stringify(msg));
        });
    };
    MexcConnector.prototype.onMessage = function (data) {
        try {
            var message = JSON.parse(data.toString());
            console.log("[".concat(this.marketIdentifier, "] Mensagem recebida:"), JSON.stringify(message));
            if (message.channel === 'push.ticker' && message.data) {
                var ticker = message.data;
                var pair = ticker.symbol.replace('_', '/').toUpperCase();
                var priceData = {
                    bestAsk: parseFloat(ticker.ask),
                    bestBid: parseFloat(ticker.bid),
                };
                if (!priceData.bestAsk || !priceData.bestBid) {
                    console.log("[".concat(this.marketIdentifier, "] Pre\u00E7os inv\u00E1lidos recebidos:"), ticker);
                    return;
                }
                console.log("[".concat(this.marketIdentifier, "] Atualiza\u00E7\u00E3o de pre\u00E7o para ").concat(pair, ":"), priceData);
                this.priceUpdateCallback({
                    identifier: this.marketIdentifier,
                    symbol: pair,
                    marketType: 'spot',
                    bestAsk: priceData.bestAsk,
                    bestBid: priceData.bestBid,
                });
            }
        }
        catch (error) {
            console.error("[".concat(this.marketIdentifier, "] Erro ao processar mensagem:"), error);
        }
    };
    MexcConnector.prototype.onClose = function () {
        var _this = this;
        console.warn("[".concat(this.marketIdentifier, "] Conex\u00E3o fechada. Reconectando em 5 segundos..."));
        this.isConnected = false;
        this.stopPing();
        setTimeout(function () { return _this.connect(); }, 5000);
    };
    MexcConnector.prototype.onError = function (error) {
        var _a;
        console.error("[".concat(this.marketIdentifier, "] Erro no WebSocket:"), error.message);
        (_a = this.ws) === null || _a === void 0 ? void 0 : _a.close();
    };
    MexcConnector.prototype.startPing = function () {
        var _this = this;
        this.stopPing();
        this.pingInterval = setInterval(function () {
            var _a;
            if (((_a = _this.ws) === null || _a === void 0 ? void 0 : _a.readyState) === ws_1.default.OPEN) {
                var pingMsg = { method: "ping" };
                console.log("[".concat(_this.marketIdentifier, "] Enviando ping:"), JSON.stringify(pingMsg));
                _this.ws.send(JSON.stringify(pingMsg));
            }
        }, 20000);
    };
    MexcConnector.prototype.stopPing = function () {
        if (this.pingInterval)
            clearInterval(this.pingInterval);
    };
    MexcConnector.prototype.disconnect = function () {
        console.log("[".concat(this.marketIdentifier, "] Desconectando..."));
        this.isConnected = false;
        this.stopPing();
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    };
    MexcConnector.prototype.getTradablePairs = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, data, pairs, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        console.log("[".concat(this.identifier, "] Buscando pares negoci\u00E1veis..."));
                        return [4 /*yield*/, (0, node_fetch_1.default)(this.REST_URL)];
                    case 1:
                        response = _a.sent();
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _a.sent();
                        console.log("[".concat(this.identifier, "] Resposta da API:"), JSON.stringify(data).slice(0, 200) + '...');
                        if (!data.symbols || !Array.isArray(data.symbols)) {
                            console.error("[".concat(this.identifier, "] Resposta inv\u00E1lida:"), data);
                            return [2 /*return*/, []];
                        }
                        pairs = data.symbols
                            .filter(function (symbol) {
                            return symbol.status === 'ENABLED' &&
                                symbol.quoteAsset === 'USDT' &&
                                symbol.baseAsset !== 'USDT';
                        })
                            .map(function (symbol) { return "".concat(symbol.baseAsset, "/USDT"); });
                        console.log("[".concat(this.identifier, "] Pares negoci\u00E1veis encontrados:"), pairs.length);
                        return [2 /*return*/, pairs];
                    case 3:
                        error_1 = _a.sent();
                        console.error("[".concat(this.identifier, "] Erro ao buscar pares negoci\u00E1veis:"), error_1);
                        return [2 /*return*/, []];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return MexcConnector;
}(events_1.EventEmitter));
exports.MexcConnector = MexcConnector;
