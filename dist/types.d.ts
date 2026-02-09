export type ProviderType = 'aillomvox' | 'gemini' | 'openai' | 'aws' | 'qwen' | 'grok' | 'ultravox';
export interface MicrophoneConfig {
    sampleRate?: 8000 | 16000 | 24000;
    inputSampleRate?: number;
}
export interface ClientTool {
    name: string;
    description: string;
    parameters: Record<string, any>;
}
export interface AillomVoxConfig {
    apiKey: string;
    provider?: ProviderType;
    voice?: string;
    language?: string;
    systemPrompt?: string;
    sampleRate?: 8000 | 16000 | 24000;
    debug?: boolean;
    tools?: ClientTool[];
    webhookUrl?: string;
    maxDuration?: number;
}
export interface TranscriptEvent {
    role: 'user' | 'assistant';
    text: string;
    final: boolean;
}
export interface ToolCallEvent {
    call_id: string;
    name: string;
    args: any;
}
export interface AudioEvent {
    buffer: ArrayBuffer;
}
export type EventHandler<T = any> = (data: T) => void;
