import { AillomVoxConfig, TranscriptEvent, ToolCallEvent } from './types';
export declare class AillomVox {
    private ws;
    private config;
    private eventListeners;
    private isConnected;
    private url;
    constructor(config: AillomVoxConfig);
    /**
     * Connects to the AillomVox Gateway
     */
    connect(): Promise<void>;
    /**
     * Sends audio chunk (PCM 16-bit) to the AI
     */
    sendAudio(chunk: ArrayBuffer | Int16Array | Buffer): void;
    /**
     * Sends a tool result back to the AI
     */
    sendToolResult(callId: string, result: any): void;
    /**
     * Disconnects the session
     */
    disconnect(): void;
    /**
     * Subscribes to an event
     */
    on(event: 'audio', handler: (data: ArrayBuffer) => void): void;
    on(event: 'transcript', handler: (data: TranscriptEvent) => void): void;
    on(event: 'tool_call', handler: (data: ToolCallEvent) => void): void;
    on(event: 'error', handler: (error: any) => void): void;
    on(event: 'connected' | 'disconnected' | 'interruption', handler: (data: any) => void): void;
    private sendConfig;
    private handleMessage;
    private emit;
    /**
     * Clones a voice using the Aillom Vox clone API.
     * @param clip Blob or File with the audio recording.
     * @param apiKey The API key for authorization.
     * @param options name, description, and gateway url.
     * @returns The generated voice ID.
     */
    static cloneVoice(clip: Blob, apiKey: string, options?: {
        name?: string;
        description?: string;
        gatewayUrl?: string;
    }): Promise<string>;
}
