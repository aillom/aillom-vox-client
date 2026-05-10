import { AillomVoxConfig, EventHandler, ProvidersCatalogOptions } from './types';
/**
 * Browser or Node.js WebSocket client for the AillomVox voice gateway.
 *
 * Protocol summary: after `connect()`, the first outbound message must be the JSON `config`
 * handshake (sent automatically). All further outbound binary messages are PCM16 mono chunks.
 */
export declare class AillomVox {
    private ws;
    private readonly config;
    private readonly eventListeners;
    private isConnected;
    private readonly url;
    constructor(config: AillomVoxConfig);
    /** Resolved WebSocket URL after normalization. */
    get websocketUrl(): string;
    /**
     * Connects to the gateway and sends the `config` handshake as the first message.
     */
    connect(): Promise<void>;
    /**
     * Send microphone capture to the model. PCM16 LE mono at the configured `sampleRate`.
     */
    sendAudio(chunk: ArrayBuffer | Int16Array | Buffer): void;
    /**
     * Reply to a `tool_call` event within 15 seconds or the model may stall.
     */
    sendToolResult(callId: string, result: unknown): void;
    /** Ask the server to end the call (mirrors dashboard playground). */
    sendHangup(): void;
    disconnect(): void;
    on(event: string, handler: EventHandler): void;
    off(event: string, handler: EventHandler): void;
    private sendConfig;
    private handleMessage;
    private emit;
    /**
     * `GET /api/providers` — pricing, models, and nested voices (public; optional auth for workspace scoping).
     */
    static fetchProviders(options?: ProvidersCatalogOptions): Promise<unknown>;
    /**
     * `GET /api/voices` — optional provider filter matches dashboard catalog keys.
     */
    static fetchVoices(options?: {
        baseUrl?: string;
        provider?: string;
        apiKey?: string;
    }): Promise<unknown>;
    /**
     * Upload a short clean recording to create a cloned voice handle.
     */
    static cloneVoice(clip: Blob, apiKey: string, options?: {
        name?: string;
        description?: string;
        gatewayUrl?: string;
    }): Promise<string>;
}
