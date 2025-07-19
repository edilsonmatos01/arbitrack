import { EventEmitter } from 'events';
export declare class MexcConnector extends EventEmitter {
    private ws;
    private readonly marketIdentifier;
    private readonly onPriceUpdate;
    private readonly onConnectedCallback;
    private isConnected;
    private isConnecting;
    private reconnectAttempts;
    private readonly maxReconnectAttempts;
    private readonly reconnectDelay;
    private subscriptions;
    private pingInterval;
    private pingTimeout;
    private pendingSubscriptions;
    private lastPingTime;
    constructor(identifier: string, onPriceUpdate: (data: any) => void, onConnect: () => void);
    connect(): void;
    private startHeartbeat;
    private handleDisconnect;
    subscribe(symbols: string[]): void;
    private sendSubscriptionRequests;
    disconnect(): void;
    getTradablePairs(): Promise<string[]>;
}
