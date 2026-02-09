"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AillomVox = void 0;
const isomorphic_ws_1 = __importDefault(require("isomorphic-ws"));
class AillomVox {
    constructor(config) {
        this.ws = null;
        this.eventListeners = new Map();
        this.isConnected = false;
        this.url = 'wss://vox.aillom.com/ws';
        this.config = config;
        if (!this.config.apiKey) {
            throw new Error('AillomVox: apiKey is required');
        }
    }
    /**
     * Connects to the AillomVox Gateway
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
     * Sends audio chunk (PCM 16-bit) to the AI
     */
    sendAudio(chunk) {
        if (!this.ws || this.ws.readyState !== isomorphic_ws_1.default.OPEN)
            return;
        this.ws.send(chunk);
    }
    /**
     * Sends a tool result back to the AI
     */
    sendToolResult(callId, result) {
        if (!this.ws || this.ws.readyState !== isomorphic_ws_1.default.OPEN)
            return;
        this.ws.send(JSON.stringify({
            type: 'tool_result',
            call_id: callId,
            result: result
        }));
    }
    /**
     * Disconnects the session
     */
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
        this.eventListeners.get(event)?.push(handler);
    }
    sendConfig() {
        if (!this.ws)
            return;
        const payload = {
            type: 'config',
            apikey: this.config.apiKey,
            provider: this.config.provider || 'aillomvox',
            voice: this.config.voice || 'Edward',
            language: this.config.language || 'en-US',
            sample_rate: this.config.sampleRate || 16000,
            system_prompt: this.config.systemPrompt,
            tools: this.config.tools,
            webhook_url: this.config.webhookUrl,
            max_duration: this.config.maxDuration
        };
        if (this.config.debug) {
            console.log('[AillomVox] Sending config:', JSON.stringify(payload, null, 2));
        }
        this.ws.send(JSON.stringify(payload));
    }
    handleMessage(event) {
        const data = event.data;
        // Handle Binary Audio
        if (data instanceof ArrayBuffer || (typeof Buffer !== 'undefined' && Buffer.isBuffer(data))) {
            this.emit('audio', data);
            return;
        }
        // Handle JSON Control Messages
        if (typeof data === 'string') {
            try {
                const msg = JSON.parse(data);
                switch (msg.type) {
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
                    case 'hangup':
                        this.disconnect();
                        this.emit('disconnected', { reason: 'agent_hangup' });
                        break;
                    default:
                        if (this.config.debug)
                            console.log('[AillomVox] Data:', msg);
                }
            }
            catch (e) {
                console.error('[AillomVox] Failed to parse message:', e);
            }
        }
    }
    emit(event, data) {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.forEach(handler => handler(data));
        }
    }
}
exports.AillomVox = AillomVox;
