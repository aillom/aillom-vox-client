"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AillomVox = void 0;
const constants_1 = require("./constants");
const gateway_url_1 = require("./gateway-url");
const isomorphic_ws_1 = __importDefault(require("isomorphic-ws"));
function isNodeRuntime() {
    return typeof process !== 'undefined' && Boolean(process.versions?.node);
}
function resolveHttpOrigin(baseUrl) {
    if (baseUrl?.startsWith('wss://') || baseUrl?.startsWith('ws://')) {
        return (0, gateway_url_1.httpOriginFromGatewayUrl)(baseUrl);
    }
    return baseUrl?.replace(/\/?$/, '') || constants_1.AILLOMVOX_DEFAULT_HTTP_ORIGIN;
}
function setSearchParams(url, params) {
    for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null || String(value).trim() === '')
            continue;
        url.searchParams.set(key, String(value));
    }
}
/**
 * Browser or Node.js WebSocket client for the AillomVox voice gateway.
 *
 * Protocol summary: after `connect()`, the first outbound message must be the JSON `config`
 * handshake (sent automatically). All further outbound binary messages are PCM16 mono chunks.
 */
class AillomVox {
    constructor(config) {
        this.ws = null;
        this.eventListeners = new Map();
        this.isConnected = false;
        this.config = config;
        this.url = (0, gateway_url_1.normalizeWebSocketUrl)(config.gatewayUrl);
        if (!config.apiKey) {
            throw new Error('AillomVox: apiKey is required');
        }
    }
    /** Resolved WebSocket URL after normalization. */
    get websocketUrl() {
        return this.url;
    }
    /** True when the underlying WebSocket is open. */
    get connected() {
        return Boolean(this.ws && this.ws.readyState === isomorphic_ws_1.default.OPEN);
    }
    /**
     * Connects to the gateway and sends the `config` handshake as the first message.
     */
    connect() {
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
                this.ws.onmessage = (event) => {
                    this.handleMessage(event);
                };
                this.ws.onerror = (error) => {
                    this.emit('error', error);
                    if (!this.isConnected)
                        reject(error);
                };
                this.ws.onclose = (event) => {
                    this.isConnected = false;
                    this.emit('disconnected', { code: event.code, reason: event.reason });
                };
            }
            catch (err) {
                reject(err);
            }
        });
    }
    createWebSocket() {
        if (this.config.authMode === 'header' && !isNodeRuntime()) {
            throw new Error('AillomVox: authMode "header" requires a Node.js runtime with WebSocket header support');
        }
        if (this.shouldUseHeaderAuth()) {
            const WebSocketWithOptions = isomorphic_ws_1.default;
            return new WebSocketWithOptions(this.url, [], {
                headers: { 'x-api-key': this.config.apiKey },
            });
        }
        return new isomorphic_ws_1.default(this.url);
    }
    shouldUseHeaderAuth() {
        const mode = this.config.authMode ?? 'auto';
        if (mode === 'header' || mode === 'both')
            return isNodeRuntime();
        return mode === 'auto' && isNodeRuntime();
    }
    shouldSendHandshakeApiKey() {
        const mode = this.config.authMode ?? 'auto';
        if (mode === 'handshake' || mode === 'both')
            return true;
        if (mode === 'header')
            return false;
        return !this.shouldUseHeaderAuth();
    }
    /**
     * Send microphone capture to the model. PCM16 LE mono at the configured `sampleRate`.
     */
    sendAudio(chunk) {
        if (!this.ws || this.ws.readyState !== isomorphic_ws_1.default.OPEN)
            return;
        if (chunk instanceof Int16Array) {
            this.ws.send(chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.byteLength));
            return;
        }
        this.ws.send(chunk);
    }
    /**
     * Reply to a `tool_call` event within 15 seconds or the model may stall.
     */
    sendToolResult(callId, result) {
        this.sendJson({
            type: 'tool_result',
            call_id: callId,
            result,
        });
    }
    /** Ask the server to end the call (mirrors dashboard playground). */
    sendHangup() {
        this.sendJson({ type: 'hangup' });
    }
    /** Send a text turn over the same WebSocket session. */
    sendText(text) {
        this.sendJson({ type: 'text', data: text });
    }
    /** Send image payload data for gateways with vision support. */
    sendImage(data) {
        this.sendJson({ type: 'image', data });
    }
    sendJson(payload) {
        if (!this.ws || this.ws.readyState !== isomorphic_ws_1.default.OPEN)
            return;
        this.ws.send(JSON.stringify(payload));
    }
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
            this.isConnected = false;
        }
    }
    on(event, handler) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(handler);
    }
    off(event, handler) {
        const list = this.eventListeners.get(event);
        if (!list)
            return;
        this.eventListeners.set(event, list.filter((h) => h !== handler));
    }
    sendConfig() {
        if (!this.ws)
            return;
        const payload = {
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
        if (this.config.qualityProfile)
            payload.quality_profile = this.config.qualityProfile;
        if (this.config.toolTimeout !== undefined)
            payload.tool_timeout = this.config.toolTimeout;
        if (this.config.ttsBufferMs !== undefined)
            payload.tts_buffer_ms = this.config.ttsBufferMs;
        if (this.config.ttsEarlyStartMs !== undefined)
            payload.tts_early_start_ms = this.config.ttsEarlyStartMs;
        if (this.config.ttsMinChunkMs !== undefined)
            payload.tts_min_chunk_ms = this.config.ttsMinChunkMs;
        if (this.config.streamLlmTextToTts !== undefined)
            payload.stream_llm_text_to_tts = this.config.streamLlmTextToTts;
        if (this.config.accumulatorMs !== undefined)
            payload.accumulator_ms = this.config.accumulatorMs;
        if (this.config.extraConfig)
            payload.extra_config = this.config.extraConfig;
        const provider = String(payload.provider);
        if (provider === 'aillomvox') {
            payload.tts_engine = this.config.ttsEngine ?? 'inworld';
        }
        if (this.config.debug) {
            const redacted = { ...payload };
            if (redacted.apikey)
                redacted.apikey = '[REDACTED]';
            console.log('[AillomVox] config:', JSON.stringify(redacted, null, 2));
        }
        this.ws.send(JSON.stringify(payload));
    }
    handleMessage(event) {
        const data = event.data;
        if (data instanceof ArrayBuffer || (typeof Buffer !== 'undefined' && Buffer.isBuffer(data))) {
            this.emit('audio', data);
            return;
        }
        if (typeof data !== 'string')
            return;
        let msg;
        try {
            msg = JSON.parse(data);
        }
        catch {
            console.error('[AillomVox] Non-JSON text message');
            return;
        }
        this.emit('raw', msg);
        const t = msg.type;
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
                if (this.config.debug)
                    console.log('[AillomVox] message:', msg);
        }
    }
    emit(event, data) {
        const listeners = this.eventListeners.get(event);
        if (!listeners)
            return;
        for (const handler of listeners)
            handler(data);
    }
    /**
     * `GET /api/providers` — models and nested voices (public; optional auth for workspace scoping).
     */
    static async fetchProviders(options) {
        const origin = resolveHttpOrigin(options?.baseUrl);
        const url = new URL('/api/providers', origin.endsWith('/') ? origin : `${origin}/`);
        setSearchParams(url, {
            workspace_id: options?.workspaceId,
            include_voices: options?.includeVoices === undefined ? undefined : options.includeVoices,
        });
        const headers = {};
        if (options?.apiKey)
            headers['x-api-key'] = options.apiKey;
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
    static async fetchPricing(options) {
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
    static async fetchVoices(options) {
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
        const headers = {};
        if (options?.apiKey)
            headers['x-api-key'] = options.apiKey;
        const res = await fetch(url.toString(), { headers });
        if (!res.ok) {
            const body = await res.text();
            throw new Error(`fetchVoices failed (${res.status}): ${body}`);
        }
        return res.json();
    }
    /** Build the public `/api/voices/preview` URL for a provider voice. */
    static buildVoicePreviewUrl(options) {
        const origin = resolveHttpOrigin(options.baseUrl);
        const url = new URL('/api/voices/preview', origin.endsWith('/') ? origin : `${origin}/`);
        setSearchParams(url, {
            provider: options.provider,
            voice: options.voice,
        });
        return url.toString();
    }
    /** `GET /api/voices/preview` — returns an audio Blob for UI preview playback. */
    static async fetchVoicePreview(options) {
        const res = await fetch(AillomVox.buildVoicePreviewUrl(options));
        if (!res.ok) {
            const body = await res.text();
            throw new Error(`fetchVoicePreview failed (${res.status}): ${body}`);
        }
        return res.blob();
    }
    /** `DELETE /api/voices/:id` — removes a workspace-owned cloned voice. */
    static async deleteVoice(voiceId, apiKey, options = {}) {
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
    static async cloneVoice(clip, apiKey, options = {}) {
        const data = await AillomVox.cloneVoiceDetailed(clip, apiKey, options);
        if (!data.voice_id) {
            throw new Error(data.message || 'Voice clone did not return a voice_id');
        }
        return data.voice_id;
    }
    /**
     * Upload a short clean recording and return the full multi-provider clone response.
     */
    static async cloneVoiceDetailed(clip, apiKey, options = {}) {
        const origin = resolveHttpOrigin(options.baseUrl || options.gatewayUrl);
        const formData = new FormData();
        formData.append('clip', clip, options.filename || 'clone.wav');
        if (options.name)
            formData.append('name', options.name);
        if (options.description)
            formData.append('description', options.description);
        if (options.providers?.length)
            formData.append('providers', options.providers.join(','));
        if (options.workspaceId)
            formData.append('workspace_id', options.workspaceId);
        if (options.language)
            formData.append('language', options.language);
        if (options.transcription || options.transcript)
            formData.append('transcription', options.transcription || options.transcript || '');
        if (options.gender)
            formData.append('gender', options.gender);
        if (options.accent)
            formData.append('accent', options.accent);
        if (options.age)
            formData.append('age', options.age);
        if (options.tone)
            formData.append('tone', options.tone);
        if (options.useCase)
            formData.append('use_case', options.useCase);
        const response = await fetch(`${origin.replace(/\/?$/, '')}/api/voices/clone`, {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
            },
            body: formData,
        });
        if (!response.ok) {
            const err = (await response.json().catch(() => ({})));
            throw new Error(err.error || `Failed to clone voice: ${response.status}`);
        }
        return (await response.json());
    }
}
exports.AillomVox = AillomVox;
