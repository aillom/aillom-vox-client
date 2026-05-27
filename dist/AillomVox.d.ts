import { AillomVoxConfig, CloneVoiceOptions, CloneVoiceResult, DeleteVoiceOptions, ErrorEvent, EventHandler, ProvidersCatalogOptions, StateEvent, ToolCallEvent, TranscriptEvent, VoicePreviewOptions, VoicesCatalogOptions } from './types';
import WebSocket from 'isomorphic-ws';
export type ClientEvent = 'audio' | 'transcript' | 'tool_call' | 'error' | 'connected' | 'disconnected' | 'interruption' | 'playback_clear_buffer' | 'state' | 'control' | 'raw';
export interface VoxClientEventMap {
    audio: ArrayBuffer | ArrayBufferView;
    transcript: TranscriptEvent;
    tool_call: ToolCallEvent;
    error: ErrorEvent | WebSocket.ErrorEvent | unknown;
    connected: Record<string, never>;
    disconnected: {
        code?: number;
        reason?: string;
    };
    interruption: Record<string, never>;
    playback_clear_buffer: Record<string, never>;
    state: StateEvent;
    control: Record<string, unknown>;
    raw: Record<string, unknown>;
}
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
    /** True when the underlying WebSocket is open. */
    get connected(): boolean;
    /**
     * Connects to the gateway and sends the `config` handshake as the first message.
     */
    connect(): Promise<void>;
    private createWebSocket;
    private shouldUseHeaderAuth;
    private shouldSendHandshakeApiKey;
    /**
     * Send microphone capture to the model. PCM16 LE mono at the configured `sampleRate`.
     */
    sendAudio(chunk: ArrayBuffer | ArrayBufferView): void;
    /**
     * Reply to a `tool_call` event within 15 seconds or the model may stall.
     */
    sendToolResult(callId: string, result: unknown): void;
    /** Ask the server to end the call (mirrors dashboard playground). */
    sendHangup(): void;
    /** Send a text turn over the same WebSocket session. */
    sendText(text: string): void;
    /** Send image payload data for gateways with vision support. */
    sendImage(data: string | Record<string, unknown>): void;
    private sendJson;
    disconnect(): void;
    on<K extends keyof VoxClientEventMap>(event: K, handler: EventHandler<VoxClientEventMap[K]>): void;
    on(event: string, handler: EventHandler): void;
    off<K extends keyof VoxClientEventMap>(event: K, handler: EventHandler<VoxClientEventMap[K]>): void;
    off(event: string, handler: EventHandler): void;
    private sendConfig;
    private handleMessage;
    private emit;
    /**
     * `GET /api/providers` — models and nested voices (public; optional auth for workspace scoping).
     */
    static fetchProviders(options?: ProvidersCatalogOptions): Promise<unknown>;
    /**
     * `GET /api/pricing` — public USD/min rate card from the live gateway.
     */
    static fetchPricing(options?: {
        baseUrl?: string;
    }): Promise<unknown>;
    /**
     * `GET /api/voices` — optional provider filter matches dashboard catalog keys.
     */
    static fetchVoices(options: VoicesCatalogOptions): Promise<unknown>;
    /** Build the public `/api/voices/preview` URL for a provider voice. */
    static buildVoicePreviewUrl(options: VoicePreviewOptions): string;
    /** `GET /api/voices/preview` — returns an audio Blob for UI preview playback. */
    static fetchVoicePreview(options: VoicePreviewOptions): Promise<Blob>;
    /** `DELETE /api/voices/:id` — removes a workspace-owned cloned voice. */
    static deleteVoice(voiceId: string, apiKey: string, options?: DeleteVoiceOptions): Promise<unknown>;
    /**
     * Upload a short clean recording to create a cloned voice handle.
     */
    static cloneVoice(clip: Blob, apiKey: string, options?: CloneVoiceOptions): Promise<string>;
    /**
     * Upload a short clean recording and return the full multi-provider clone response.
     */
    static cloneVoiceDetailed(clip: Blob, apiKey: string, options?: CloneVoiceOptions): Promise<CloneVoiceResult>;
}
