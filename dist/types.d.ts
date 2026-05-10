import type { AillomVoxTtsEngineId } from './constants';
/**
 * Known stable provider ids. The gateway may accept additional strings and normalizes aliases
 * (see product docs / `GET /api/providers`).
 */
export type VoxProviderId = 'aillomvox'
/** Premium Cartesia track (usage labels may show `aillomvoxmax`). */
 | 'aillomvoxmax' | 'aillomvoxplus' | 'aillomplus' | 'openai' | 'gemini' | 'aws' | 'qwen' | 'grok' | 'ultravox' | (string & {});
export interface ClientTool {
    name: string;
    description: string;
    /** JSON Schema parameters for the function (OpenAI-style). */
    parameters: Record<string, unknown>;
}
export interface AillomVoxConfig {
    /**
     * Gateway API key (`av_…`). **Secret** — treat like a password.
     * In public web apps, anyone can extract a key shipped to the browser; prefer a
     * server-issued short-lived token or a backend proxy that holds the real key.
     */
    apiKey: string;
    /** Lowercase provider id, e.g. `aillomvox`, `openai`. Default: `aillomvox`. */
    provider?: VoxProviderId;
    voice?: string;
    language?: string;
    /**
     * Required for production sessions per gateway docs; defaults are applied only client-side for quick tests.
     */
    systemPrompt?: string;
    sampleRate?: 8000 | 16000 | 24000;
    /**
     * When true, logs outbound config (with `apikey` redacted) and unknown inbound JSON.
     * Disable in production; logs and the `raw` event may contain user speech text (PII).
     */
    debug?: boolean;
    tools?: ClientTool[];
    /** HTTPS(S) webhook for server-side session events (if enabled for your key). */
    webhookUrl?: string;
    /** Session cap in seconds (typically 60–3600). */
    maxDuration?: number;
    /** Spoken right after the session is ready. */
    firstMessage?: string;
    /** Spoken before forced hangup when `max_duration` is reached (see protocol docs). */
    farewellMessage?: string;
    /**
     * When `provider === "aillomvox"`, selects the TTS stack from `GET /api/providers`.
     * Defaults to **`lmnt`** when omitted (the SDK sets `tts_engine` in the handshake).
     */
    ttsEngine?: AillomVoxTtsEngineId | string;
    /** Optional model override when the provider exposes multiple SKUs (see `/api/providers`). */
    model?: string;
    /**
     * WebSocket URL or HTTPS API origin. Examples:
     * - `wss://vox.aillom.com/ws` (default)
     * - `https://vox.aillom.com` (normalized to the same WebSocket URL)
     */
    gatewayUrl?: string;
}
export interface TranscriptEvent {
    type?: 'transcript';
    role: 'user' | 'assistant';
    text: string;
    final: boolean;
}
export interface ToolCallEvent {
    type?: 'tool_call';
    call_id: string;
    name: string;
    args: Record<string, unknown>;
}
/** Agent state (Ultravox-oriented pipeline). */
export type VoxAgentState = 'listening' | 'thinking' | 'speaking';
export interface StateEvent {
    type: 'state';
    state: VoxAgentState;
}
/** Engine connection milestones from the gateway. */
export interface ControlEvent {
    type: 'control';
    action?: string;
    provider?: string;
    model?: string;
    tts_model?: string;
    [key: string]: unknown;
}
export interface ErrorEvent {
    type?: 'error';
    message?: string;
    error?: string;
    code?: string;
}
export type EventHandler<T = unknown> = (data: T) => void;
export interface ProvidersCatalogOptions {
    /** Same base you use for `gatewayUrl` / clone API; defaults to production. */
    baseUrl?: string;
    /** When set, `x-api-key` must belong to that workspace (gateway returns 401/403 otherwise). */
    workspaceId?: string;
    apiKey?: string;
}
