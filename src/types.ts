import type { AillomVoxTtsEngineId } from './constants';

/**
 * Known stable provider ids. The gateway may accept additional strings and normalizes aliases
 * (see product docs / `GET /api/providers`).
 */
export type VoxProviderId =
    | 'aillomvox'
    | 'openai'
    | 'gemini'
    | 'aws'
    | 'qwen'
    | 'grok'
    | 'ultravox'
    | (string & {});

export interface ClientTool {
    name: string;
    description: string;
    /** JSON Schema parameters for the function (OpenAI-style). */
    parameters?: Record<string, unknown>;
    /** Backward-compatible location used by some dashboard tool presets. */
    config?: Record<string, unknown>;
    /** Optional server-side endpoint metadata, including `aillom-connect://...` tools. */
    url?: string;
    endpoint_url?: string;
    endpointUrl?: string;
    [key: string]: unknown;
}

export type VoxAuthMode = 'auto' | 'handshake' | 'header' | 'both';

export interface AillomVoxConfig {
    /**
     * Gateway API key (`av_…`). **Secret** — treat like a password.
     * In public web apps, anyone can extract a key shipped to the browser; prefer a
     * server-issued short-lived token or a backend proxy that holds the real key.
     */
    apiKey: string;
    /**
     * WebSocket auth strategy. Default `auto` sends `x-api-key` from Node.js and falls
     * back to the config `apikey` field in browsers, where custom WebSocket headers are unavailable.
     */
    authMode?: VoxAuthMode;
    /** Lowercase provider id, e.g. `aillomvox`, `openai`. Default: `aillomvox`. */
    provider?: VoxProviderId;
    voice?: string;
    language?: string;
    /** Optional workspace scope; requires an API key authorized for that workspace. */
    workspaceId?: string;
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
    /** Session cap in seconds (`30`-`7200`; default gateway cap is 300). */
    maxDuration?: number;
    /** Spoken right after the session is ready. */
    firstMessage?: string;
    /** Spoken before forced hangup when `max_duration` is reached (see protocol docs). */
    farewellMessage?: string;
    /**
     * When `provider === "aillomvox"`, selects the TTS stack from `GET /api/providers`.
     * Defaults to **`inworld`** when omitted (the SDK sets `tts_engine` in the handshake).
     */
    ttsEngine?: AillomVoxTtsEngineId | string;
    /**
     * @deprecated Session model overrides are ignored by the current gateway; model selection
     * is controlled server-side. Use `AillomVox.fetchProviders()` to inspect active defaults.
     */
    model?: string;
    qualityProfile?: string;
    toolTimeout?: number;
    ttsBufferMs?: number;
    ttsEarlyStartMs?: number;
    ttsMinChunkMs?: number;
    streamLlmTextToTts?: boolean;
    accumulatorMs?: number;
    /** Advanced provider config passed through as `extra_config`. Do not put browser-visible secrets here. */
    extraConfig?: Record<string, unknown>;
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
    /** Set false to skip nested voices in `/api/providers` for faster catalog loads. */
    includeVoices?: boolean;
    apiKey?: string;
}

export interface VoicesCatalogOptions {
    /** Provider or TTS engine id, e.g. `inworld`, `fish`, `aws`, `qwen`. */
    provider: string;
    baseUrl?: string;
    /** When set, `x-api-key` must belong to that workspace. */
    workspaceId?: string;
    apiKey?: string;
    pageSize?: number;
    pageNumber?: number;
    maxPages?: number;
    q?: string;
    title?: string;
    tag?: string;
    language?: string;
    titleLanguage?: string;
    sortBy?: string;
    preferredLanguage?: string;
    type?: string;
    scope?: string;
    visibility?: string;
}

export interface VoicePreviewOptions {
    provider: string;
    voice: string;
    baseUrl?: string;
}

export interface DeleteVoiceOptions {
    provider?: string;
    workspaceId?: string;
    baseUrl?: string;
}

export interface CloneVoiceProviderResult {
    status: 'ok' | 'skipped' | 'error' | string;
    voice_id?: string;
    name?: string;
    error?: string;
    [key: string]: unknown;
}

export interface CloneVoiceResult {
    voice_id: string | null;
    name?: string;
    workspace_id?: string | null;
    providers?: Record<string, CloneVoiceProviderResult>;
    message?: string;
    [key: string]: unknown;
}

export interface CloneVoiceOptions {
    name?: string;
    description?: string;
    baseUrl?: string;
    gatewayUrl?: string;
    filename?: string;
    workspaceId?: string;
    /** Comma-separated internally by the SDK. Defaults to the server route defaults. */
    providers?: string[];
    /** BCP 47 locale, or `AUTO`. Helps providers that need language hints. */
    language?: string;
    /** Exact transcript of the audio sample; recommended for Inworld and Fish Audio. */
    transcription?: string;
    /** Alias accepted by the gateway. */
    transcript?: string;
    /** Optional xAI clone metadata. */
    gender?: 'male' | 'female' | 'neutral';
    accent?: string;
    age?: 'young' | 'middle-aged' | 'old';
    tone?: 'warm' | 'casual' | 'professional' | 'friendly' | 'authoritative' | 'expressive' | 'calm';
    useCase?: 'conversational' | 'narration' | 'characters' | 'educational' | 'advertisement' | 'social_media' | 'entertainment';
}
