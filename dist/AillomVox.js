"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AillomVox = void 0;
const constants_1 = require("./constants");
const gateway_url_1 = require("./gateway-url");
const isomorphic_ws_1 = __importDefault(require("isomorphic-ws"));
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
    /**
     * Connects to the gateway and sends the `config` handshake as the first message.
     */
    connect() {
        return new Promise((resolve, reject) => {
            try {
                this.ws = new isomorphic_ws_1.default(this.url);
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
        if (!this.ws || this.ws.readyState !== isomorphic_ws_1.default.OPEN)
            return;
        this.ws.send(JSON.stringify({
            type: 'tool_result',
            call_id: callId,
            result,
        }));
    }
    /** Ask the server to end the call (mirrors dashboard playground). */
    sendHangup() {
        if (!this.ws || this.ws.readyState !== isomorphic_ws_1.default.OPEN)
            return;
        this.ws.send(JSON.stringify({ type: 'hangup' }));
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
            apikey: this.config.apiKey,
            provider: (this.config.provider ?? 'aillomvox').toLowerCase(),
            voice: this.config.voice ?? 'lily',
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
        if (provider === 'aillomvox') {
            payload.tts_engine = this.config.ttsEngine ?? 'lmnt';
        }
        if (this.config.debug) {
            const redacted = { ...payload, apikey: '[REDACTED]' };
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
     * `GET /api/providers` — pricing, models, and nested voices (public; optional auth for workspace scoping).
     */
    static async fetchProviders(options) {
        const origin = options?.baseUrl?.startsWith('wss://') || options?.baseUrl?.startsWith('ws://')
            ? (0, gateway_url_1.httpOriginFromGatewayUrl)(options.baseUrl)
            : options?.baseUrl?.replace(/\/?$/, '') || constants_1.AILLOMVOX_DEFAULT_HTTP_ORIGIN;
        const url = new URL('/api/providers', origin.endsWith('/') ? origin : `${origin}/`);
        if (options?.workspaceId) {
            url.searchParams.set('workspace_id', options.workspaceId);
        }
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
     * `GET /api/voices` — optional provider filter matches dashboard catalog keys.
     */
    static async fetchVoices(options) {
        const origin = options?.baseUrl?.startsWith('wss://') || options?.baseUrl?.startsWith('ws://')
            ? (0, gateway_url_1.httpOriginFromGatewayUrl)(options.baseUrl)
            : options?.baseUrl?.replace(/\/?$/, '') || constants_1.AILLOMVOX_DEFAULT_HTTP_ORIGIN;
        const url = new URL('/api/voices', origin.endsWith('/') ? origin : `${origin}/`);
        if (options?.provider)
            url.searchParams.set('provider', options.provider);
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
    /**
     * Upload a short clean recording to create a cloned voice handle.
     */
    static async cloneVoice(clip, apiKey, options = {}) {
        const origin = (0, gateway_url_1.httpOriginFromGatewayUrl)(options.gatewayUrl);
        const formData = new FormData();
        formData.append('clip', clip, 'clone.wav');
        if (options.name)
            formData.append('name', options.name);
        if (options.description)
            formData.append('description', options.description);
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
        const data = (await response.json());
        return data.voice_id;
    }
}
exports.AillomVox = AillomVox;
