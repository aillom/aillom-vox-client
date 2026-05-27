import {
    AillomVoxConfig,
    CloneVoiceOptions,
    CloneVoiceResult,
    DeleteVoiceOptions,
    ErrorEvent,
    EventHandler,
    ProvidersCatalogOptions,
    StateEvent,
    ToolCallEvent,
    TranscriptEvent,
    VoicePreviewOptions,
    VoicesCatalogOptions,
} from './types';
import { AILLOMVOX_DEFAULT_HTTP_ORIGIN } from './constants';
import { httpOriginFromGatewayUrl, normalizeWebSocketUrl } from './gateway-url';
import WebSocket from 'isomorphic-ws';

export type ClientEvent =
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

export interface VoxClientEventMap {
    audio: ArrayBuffer | ArrayBufferView;
    transcript: TranscriptEvent;
    tool_call: ToolCallEvent;
    error: ErrorEvent | WebSocket.ErrorEvent | unknown;
    connected: Record<string, never>;
    disconnected: { code?: number; reason?: string };
    interruption: Record<string, never>;
    playback_clear_buffer: Record<string, never>;
    state: StateEvent;
    control: Record<string, unknown>;
    raw: Record<string, unknown>;
}

type QueryValue = string | number | boolean | undefined | null;

function isNodeRuntime(): boolean {
    return typeof process !== 'undefined' && Boolean(process.versions?.node);
}

function resolveHttpOrigin(baseUrl?: string): string {
    if (baseUrl?.startsWith('wss://') || baseUrl?.startsWith('ws://')) {
        return httpOriginFromGatewayUrl(baseUrl);
    }
    return baseUrl?.replace(/\/?$/, '') || AILLOMVOX_DEFAULT_HTTP_ORIGIN;
}

function setSearchParams(url: URL, params: Record<string, QueryValue>): void {
    for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null || String(value).trim() === '') continue;
        url.searchParams.set(key, String(value));
    }
}

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

    /** True when the underlying WebSocket is open. */
    public get connected(): boolean {
        return Boolean(this.ws && this.ws.readyState === WebSocket.OPEN);
    }

    /**
     * Connects to the gateway and sends the `config` handshake as the first message.
     */
    public connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                this.ws = this.createWebSocket();
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

    private createWebSocket(): WebSocket {
        if (this.config.authMode === 'header' && !isNodeRuntime()) {
            throw new Error('AillomVox: authMode "header" requires a Node.js runtime with WebSocket header support');
        }

        if (this.shouldUseHeaderAuth()) {
            const WebSocketWithOptions = WebSocket as unknown as {
                new (
                    address: string,
                    protocols?: string | string[],
                    options?: { headers?: Record<string, string> },
                ): WebSocket;
            };
            return new WebSocketWithOptions(this.url, [], {
                headers: { 'x-api-key': this.config.apiKey },
            });
        }

        return new WebSocket(this.url);
    }

    private shouldUseHeaderAuth(): boolean {
        const mode = this.config.authMode ?? 'auto';
        if (mode === 'header' || mode === 'both') return isNodeRuntime();
        return mode === 'auto' && isNodeRuntime();
    }

    private shouldSendHandshakeApiKey(): boolean {
        const mode = this.config.authMode ?? 'auto';
        if (mode === 'handshake' || mode === 'both') return true;
        if (mode === 'header') return false;
        return !this.shouldUseHeaderAuth();
    }

    /**
     * Send microphone capture to the model. PCM16 LE mono at the configured `sampleRate`.
     */
    public sendAudio(chunk: ArrayBuffer | ArrayBufferView): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        if (ArrayBuffer.isView(chunk)) {
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
        this.sendJson({
            type: 'tool_result',
            call_id: callId,
            result,
        });
    }

    /** Ask the server to end the call (mirrors dashboard playground). */
    public sendHangup(): void {
        this.sendJson({ type: 'hangup' });
    }

    /** Send a text turn over the same WebSocket session. */
    public sendText(text: string): void {
        this.sendJson({ type: 'text', data: text });
    }

    /** Send image payload data for gateways with vision support. */
    public sendImage(data: string | Record<string, unknown>): void {
        this.sendJson({ type: 'image', data });
    }

    private sendJson(payload: Record<string, unknown>): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        this.ws.send(JSON.stringify(payload));
    }

    public disconnect(): void {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
            this.isConnected = false;
        }
    }

    public on<K extends keyof VoxClientEventMap>(event: K, handler: EventHandler<VoxClientEventMap[K]>): void;
    public on(event: string, handler: EventHandler): void;
    public on(event: string, handler: EventHandler): void {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event)!.push(handler);
    }

    public off<K extends keyof VoxClientEventMap>(event: K, handler: EventHandler<VoxClientEventMap[K]>): void;
    public off(event: string, handler: EventHandler): void;
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
            provider: (this.config.provider ?? 'aillomvox').toLowerCase(),
            voice: this.config.voice ?? 'Aanya',
            language: this.config.language ?? 'en-US',
            sample_rate: this.config.sampleRate ?? 16000,
            tools: this.config.tools ?? [],
        };

        if (this.shouldSendHandshakeApiKey()) {
            payload.apikey = this.config.apiKey;
        }
        if (this.config.systemPrompt !== undefined) {
            payload.system_prompt = this.config.systemPrompt;
        }
        if (this.config.workspaceId) {
            payload.workspace_id = this.config.workspaceId;
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
        if (this.config.qualityProfile) payload.quality_profile = this.config.qualityProfile;
        if (this.config.toolTimeout !== undefined) payload.tool_timeout = this.config.toolTimeout;
        if (this.config.ttsBufferMs !== undefined) payload.tts_buffer_ms = this.config.ttsBufferMs;
        if (this.config.ttsEarlyStartMs !== undefined) payload.tts_early_start_ms = this.config.ttsEarlyStartMs;
        if (this.config.ttsMinChunkMs !== undefined) payload.tts_min_chunk_ms = this.config.ttsMinChunkMs;
        if (this.config.streamLlmTextToTts !== undefined) payload.stream_llm_text_to_tts = this.config.streamLlmTextToTts;
        if (this.config.accumulatorMs !== undefined) payload.accumulator_ms = this.config.accumulatorMs;
        if (this.config.extraConfig) payload.extra_config = this.config.extraConfig;

        const provider = String(payload.provider);
        if (provider === 'aillomvox') {
            payload.tts_engine = this.config.ttsEngine ?? 'inworld';
        }

        if (this.config.debug) {
            const redacted = { ...payload };
            if (redacted.apikey) redacted.apikey = '[REDACTED]';
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
     * `GET /api/providers` — models and nested voices (public; optional auth for workspace scoping).
     */
    public static async fetchProviders(options?: ProvidersCatalogOptions): Promise<unknown> {
        const origin = resolveHttpOrigin(options?.baseUrl);
        const url = new URL('/api/providers', origin.endsWith('/') ? origin : `${origin}/`);
        setSearchParams(url, {
            workspace_id: options?.workspaceId,
            include_voices: options?.includeVoices === undefined ? undefined : options.includeVoices,
        });
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
     * `GET /api/pricing` — public USD/min rate card from the live gateway.
     */
    public static async fetchPricing(options?: { baseUrl?: string }): Promise<unknown> {
        const origin = resolveHttpOrigin(options?.baseUrl);
        const url = new URL('/api/pricing', origin.endsWith('/') ? origin : `${origin}/`);

        const res = await fetch(url.toString());
        if (!res.ok) {
            const body = await res.text();
            throw new Error(`fetchPricing failed (${res.status}): ${body}`);
        }
        return res.json();
    }

    /**
     * `GET /api/voices` — optional provider filter matches dashboard catalog keys.
     */
    public static async fetchVoices(options: VoicesCatalogOptions): Promise<unknown> {
        const origin = resolveHttpOrigin(options?.baseUrl);
        const url = new URL('/api/voices', origin.endsWith('/') ? origin : `${origin}/`);
        setSearchParams(url, {
            provider: options.provider,
            workspace_id: options.workspaceId,
            page_size: options.pageSize,
            page_number: options.pageNumber,
            max_pages: options.maxPages,
            q: options.q,
            title: options.title,
            tag: options.tag,
            language: options.language,
            title_language: options.titleLanguage,
            sort_by: options.sortBy,
            preferred_language: options.preferredLanguage,
            type: options.type,
            scope: options.scope,
            visibility: options.visibility,
        });
        const headers: Record<string, string> = {};
        if (options?.apiKey) headers['x-api-key'] = options.apiKey;

        const res = await fetch(url.toString(), { headers });
        if (!res.ok) {
            const body = await res.text();
            throw new Error(`fetchVoices failed (${res.status}): ${body}`);
        }
        return res.json();
    }

    /** Build the public `/api/voices/preview` URL for a provider voice. */
    public static buildVoicePreviewUrl(options: VoicePreviewOptions): string {
        const origin = resolveHttpOrigin(options.baseUrl);
        const url = new URL('/api/voices/preview', origin.endsWith('/') ? origin : `${origin}/`);
        setSearchParams(url, {
            provider: options.provider,
            voice: options.voice,
        });
        return url.toString();
    }

    /** `GET /api/voices/preview` — returns an audio Blob for UI preview playback. */
    public static async fetchVoicePreview(options: VoicePreviewOptions): Promise<Blob> {
        const res = await fetch(AillomVox.buildVoicePreviewUrl(options));
        if (!res.ok) {
            const body = await res.text();
            throw new Error(`fetchVoicePreview failed (${res.status}): ${body}`);
        }
        return res.blob();
    }

    /** `DELETE /api/voices/:id` — removes a workspace-owned cloned voice. */
    public static async deleteVoice(
        voiceId: string,
        apiKey: string,
        options: DeleteVoiceOptions = {},
    ): Promise<unknown> {
        const origin = resolveHttpOrigin(options.baseUrl);
        const url = new URL(`/api/voices/${encodeURIComponent(voiceId)}`, origin.endsWith('/') ? origin : `${origin}/`);
        setSearchParams(url, {
            provider: options.provider,
            workspace_id: options.workspaceId,
        });

        const res = await fetch(url.toString(), {
            method: 'DELETE',
            headers: { 'x-api-key': apiKey },
        });
        if (!res.ok) {
            const body = await res.text();
            throw new Error(`deleteVoice failed (${res.status}): ${body}`);
        }
        return res.json();
    }

    /**
     * Upload a short clean recording to create a cloned voice handle.
     */
    public static async cloneVoice(
        clip: Blob,
        apiKey: string,
        options: CloneVoiceOptions = {},
    ): Promise<string> {
        const data = await AillomVox.cloneVoiceDetailed(clip, apiKey, options);
        if (!data.voice_id) {
            throw new Error(data.message || 'Voice clone did not return a voice_id');
        }
        return data.voice_id;
    }

    /**
     * Upload a short clean recording and return the full multi-provider clone response.
     */
    public static async cloneVoiceDetailed(
        clip: Blob,
        apiKey: string,
        options: CloneVoiceOptions = {},
    ): Promise<CloneVoiceResult> {
        const origin = resolveHttpOrigin(options.baseUrl || options.gatewayUrl);

        const formData = new FormData();
        formData.append('clip', clip, options.filename || 'clone.wav');
        if (options.name) formData.append('name', options.name);
        if (options.description) formData.append('description', options.description);
        if (options.providers?.length) formData.append('providers', options.providers.join(','));
        if (options.workspaceId) formData.append('workspace_id', options.workspaceId);
        if (options.language) formData.append('language', options.language);
        if (options.transcription || options.transcript) formData.append('transcription', options.transcription || options.transcript || '');
        if (options.gender) formData.append('gender', options.gender);
        if (options.accent) formData.append('accent', options.accent);
        if (options.age) formData.append('age', options.age);
        if (options.tone) formData.append('tone', options.tone);
        if (options.useCase) formData.append('use_case', options.useCase);

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

        return (await response.json()) as CloneVoiceResult;
    }
}
