import { AillomVoxConfig, TranscriptEvent, ToolCallEvent, EventHandler } from './types';
import WebSocket from 'isomorphic-ws';

export class AillomVox {
    private ws: WebSocket | null = null;
    private config: AillomVoxConfig;
    private eventListeners: Map<string, EventHandler[]> = new Map();
    private isConnected: boolean = false;
    private url: string = 'wss://wss.aillom.com/ws';

    constructor(config: AillomVoxConfig) {
        this.config = config;
        if (this.config.gatewayUrl) {
            this.url = this.config.gatewayUrl;
        }
        if (!this.config.apiKey) {
            throw new Error('AillomVox: apiKey is required');
        }
    }

    /**
     * Connects to the AillomVox Gateway
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
     * Sends audio chunk (PCM 16-bit) to the AI
     */
    public sendAudio(chunk: ArrayBuffer | Int16Array | Buffer): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        this.ws.send(chunk);
    }

    /**
     * Sends a tool result back to the AI
     */
    public sendToolResult(callId: string, result: any): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        this.ws.send(JSON.stringify({
            type: 'tool_result',
            call_id: callId,
            result: result
        }));
    }

    /**
     * Disconnects the session
     */
    public disconnect(): void {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
            this.isConnected = false;
        }
    }

    /**
     * Subscribes to an event
     */
    public on(event: 'audio', handler: (data: ArrayBuffer) => void): void;
    public on(event: 'transcript', handler: (data: TranscriptEvent) => void): void;
    public on(event: 'tool_call', handler: (data: ToolCallEvent) => void): void;
    public on(event: 'error', handler: (error: any) => void): void;
    public on(event: 'connected' | 'disconnected' | 'interruption', handler: (data: any) => void): void;
    public on(event: string, handler: EventHandler): void {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event)?.push(handler);
    }

    private sendConfig() {
        if (!this.ws) return;

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

    private handleMessage(event: WebSocket.MessageEvent) {
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
                        if (this.config.debug) console.log('[AillomVox] Data:', msg);
                }
            } catch (e) {
                console.error('[AillomVox] Failed to parse message:', e);
            }
        }
    }

    private emit(event: string, data: any) {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.forEach(handler => handler(data));
        }
    }
}
