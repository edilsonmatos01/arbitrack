import { EventEmitter } from 'events';
export declare class MexcFuturesConnector extends EventEmitter {
    private ws;
    private readonly identifier;
    private readonly onPriceUpdate;
    private readonly onConnect;
    private isConnected;
    private isConnecting;
    private reconnectAttempts;
    private readonly maxReconnectAttempts;
    private readonly reconnectDelay;
    private readonly REST_URL;
    private subscribedSymbols;
    constructor(identifier: string, onPriceUpdate: (data: any) => void, onConnect: () => void);
    connect(): void;
    private startHeartbeat;
    private handleDisconnect;
    subscribe(symbols: string[]): void;
    disconnect(): void;
    getTradablePairs(): Promise<string[]>;
}
