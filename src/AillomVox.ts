import { AillomVoxConfig, EventHandler, ProvidersCatalogOptions } from './types';
import { AILLOMVOX_DEFAULT_HTTP_ORIGIN } from './constants';
import { httpOriginFromGatewayUrl, normalizeWebSocketUrl } from './gateway-url';
import WebSocket from 'isomorphic-ws';

type ClientEvent =
    | 'audio'
    | 'transcript'
    | 'tool_call'
    | 'error'
    | 'connected'
    | 'disconnected'
    | 'interruption'
    | 'playback_clear_buffer'
    | 'state'
    | 'control'
    | 'raw';

/**
 * Browser or Node.js WebSocket client for the AillomVox voice gateway.
 *
 * Protocol summary: after `connect()`, the first outbound message must be the JSON `config`
 * handshake (sent automatically). All further outbound binary messages are PCM16 mono chunks.
 */
export class AillomVox {
    private ws: WebSocket | null = null;
    private readonly config: AillomVoxConfig;
    private readonly eventListeners = new Map<string, EventHandler[]>();
    private isConnected = false;
    private readonly url: string;

    constructor(config: AillomVoxConfig) {
        this.config = config;
        this.url = normalizeWebSocketUrl(config.gatewayUrl);
        if (!config.apiKey) {
            throw new Error('AillomVox: apiKey is required');
        }
    }

    /** Resolved WebSocket URL after normalization. */
    public get websocketUrl(): string {
        return this.url;
    }

    /**
     * Connects to the gateway and sends the `config` handshake as the first message.
     */
    public connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(this.url);
                this.ws.binaryType = 'arraybuffer';

                this.ws.onopen = () => {
                    this.isConnected = true;
                    this.sendConfig();
                    this.emit('connected', {});
                    resolve();
                };

                this.ws.onmessage = (event: WebSocket.MessageEvent) => {
                    this.handleMessage(event);
                };

                this.ws.onerror = (error: WebSocket.ErrorEvent) => {
                    this.emit('error', error);
                    if (!this.isConnected) reject(error);
                };

                this.ws.onclose = (event: WebSocket.CloseEvent) => {
                    this.isConnected = false;
                    this.emit('disconnected', { code: event.code, reason: event.reason });
                };
            } catch (err) {
                reject(err);
            }
        });
    }

    /**
     * Send microphone capture to the model. PCM16 LE mono at the configured `sampleRate`.
     */
    public sendAudio(chunk: ArrayBuffer | Int16Array | Buffer): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        if (chunk instanceof Int16Array) {
            this.ws.send(
                chunk.buffer.slice(
                    chunk.byteOffset,
                    chunk.byteOffset + chunk.byteLength,
                ),
            );
            return;
        }
        this.ws.send(chunk);
    }

    /**
     * Reply to a `tool_call` event within 15 seconds or the model may stall.
     */
    public sendToolResult(callId: string, result: unknown): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        this.ws.send(
            JSON.stringify({
                type: 'tool_result',
                call_id: callId,
                result,
            }),
        );
    }

    /** Ask the server to end the call (mirrors dashboard playground). */
    public sendHangup(): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        this.ws.send(JSON.stringify({ type: 'hangup' }));
    }

    public disconnect(): void {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
            this.isConnected = false;
        }
    }

    public on(event: string, handler: EventHandler): void {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event)!.push(handler);
    }

    public off(event: string, handler: EventHandler): void {
        const list = this.eventListeners.get(event);
        if (!list) return;
        this.eventListeners.set(
            event,
            list.filter((h) => h !== handler),
        );
    }

    private sendConfig(): void {
        if (!this.ws) return;

        const payload: Record<string, unknown> = {
            type: 'config',
            apikey: this.config.apiKey,
            provider: (this.config.provider ?? 'aillomvox').toLowerCase(),
            voice: this.config.voice ?? 'Heitor',
            language: this.config.language ?? 'en-US',
            sample_rate: this.config.sampleRate ?? 16000,
            tools: this.config.tools ?? [],
        };

        if (this.config.systemPrompt !== undefined) {
            payload.system_prompt = this.config.systemPrompt;
        }
        if (this.config.webhookUrl) {
            payload.webhook_url = this.config.webhookUrl;
        }
        if (this.config.maxDuration !== undefined) {
            payload.max_duration = this.config.maxDuration;
        }
        if (this.config.firstMessage !== undefined) {
            payload.first_message = this.config.firstMessage;
        }
        if (this.config.farewellMessage !== undefined) {
            payload.farewell_message = this.config.farewellMessage;
        }
        if (this.config.model) {
            payload.model = this.config.model;
        }

        const provider = String(payload.provider);
        if (provider === 'aillomvox' && this.config.ttsEngine) {
            payload.tts_engine = this.config.ttsEngine;
        }

        if (this.config.debug) {
            const redacted = { ...payload, apikey: '[REDACTED]' };
            console.log('[AillomVox] config:', JSON.stringify(redacted, null, 2));
        }

        this.ws.send(JSON.stringify(payload));
    }

    private handleMessage(event: WebSocket.MessageEvent): void {
        const data = event.data;

        if (data instanceof ArrayBuffer || (typeof Buffer !== 'undefined' && Buffer.isBuffer(data))) {
            this.emit('audio', data);
            return;
        }

        if (typeof data !== 'string') return;

        let msg: Record<string, unknown>;
        try {
            msg = JSON.parse(data) as Record<string, unknown>;
        } catch {
            console.error('[AillomVox] Non-JSON text message');
            return;
        }

        this.emit('raw', msg);

        const t = msg.type as string | undefined;
        switch (t) {
            case 'transcript':
                this.emit('transcript', msg);
                break;
            case 'tool_call':
                this.emit('tool_call', msg);
                break;
            case 'error':
                this.emit('error', msg);
                break;
            case 'interruption':
                this.emit('interruption', {});
                break;
            case 'playback_clear_buffer':
                this.emit('playback_clear_buffer', {});
                break;
            case 'state':
                this.emit('state', msg);
                break;
            case 'control':
                this.emit('control', msg);
                break;
            case 'hangup':
            case 'close':
                this.disconnect();
                this.emit('disconnected', { reason: 'server_hangup' });
                break;
            default:
                if (this.config.debug) console.log('[AillomVox] message:', msg);
        }
    }

    private emit(event: string, data: unknown): void {
        const listeners = this.eventListeners.get(event);
        if (!listeners) return;
        for (const handler of listeners) handler(data);
    }

    /**
     * `GET /api/providers` — pricing, models, and nested voices (public; optional auth for workspace scoping).
     */
    public static async fetchProviders(options?: ProvidersCatalogOptions): Promise<unknown> {
        const origin =
            options?.baseUrl?.startsWith('wss://') || options?.baseUrl?.startsWith('ws://')
                ? httpOriginFromGatewayUrl(options.baseUrl)
                : options?.baseUrl?.replace(/\/?$/, '') || AILLOMVOX_DEFAULT_HTTP_ORIGIN;
        const url = new URL('/api/providers', origin.endsWith('/') ? origin : `${origin}/`);
        if (options?.workspaceId) {
            url.searchParams.set('workspace_id', options.workspaceId);
        }
        const headers: Record<string, string> = {};
        if (options?.apiKey) headers['x-api-key'] = options.apiKey;

        const res = await fetch(url.toString(), { headers });
        if (!res.ok) {
            const body = await res.text();
            throw new Error(`fetchProviders failed (${res.status}): ${body}`);
        }
        return res.json();
    }

    /**
     * `GET /api/voices` — optional provider filter matches dashboard catalog keys.
     */
    public static async fetchVoices(options?: {
        baseUrl?: string;
        provider?: string;
        apiKey?: string;
    }): Promise<unknown> {
        const origin =
            options?.baseUrl?.startsWith('wss://') || options?.baseUrl?.startsWith('ws://')
                ? httpOriginFromGatewayUrl(options.baseUrl)
                : options?.baseUrl?.replace(/\/?$/, '') || AILLOMVOX_DEFAULT_HTTP_ORIGIN;
        const url = new URL('/api/voices', origin.endsWith('/') ? origin : `${origin}/`);
        if (options?.provider) url.searchParams.set('provider', options.provider);
        const headers: Record<string, string> = {};
        if (options?.apiKey) headers['x-api-key'] = options.apiKey;

        const res = await fetch(url.toString(), { headers });
        if (!res.ok) {
            const body = await res.text();
            throw new Error(`fetchVoices failed (${res.status}): ${body}`);
        }
        return res.json();
    }

    /**
     * Upload a short clean recording to create a cloned voice handle.
     */
    public static async cloneVoice(
        clip: Blob,
        apiKey: string,
        options: { name?: string; description?: string; gatewayUrl?: string } = {},
    ): Promise<string> {
        const origin = httpOriginFromGatewayUrl(options.gatewayUrl);

        const formData = new FormData();
        formData.append('clip', clip, 'clone.wav');
        if (options.name) formData.append('name', options.name);
        if (options.description) formData.append('description', options.description);

        const response = await fetch(`${origin.replace(/\/?$/, '')}/api/voices/clone`, {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
            },
            body: formData,
        });

        if (!response.ok) {
            const err = (await response.json().catch(() => ({}))) as { error?: string };
            throw new Error(err.error || `Failed to clone voice: ${response.status}`);
        }

        const data = (await response.json()) as { voice_id: string };
        return data.voice_id;
    }
}
