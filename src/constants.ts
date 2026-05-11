/**
 * Canonical endpoints — keep in sync with `aillom-vox/flow-src/src/constants/publicGateway.ts`.
 */
export const AILLOMVOX_DEFAULT_WS_URL = 'wss://vox.aillom.com/ws';

/** @deprecated Hostname only — use {@link AILLOMVOX_DEFAULT_WS_URL}. The SDK rewrites this to `vox.aillom.com` in {@link migrateLegacyGatewayUrl}. */
export const AILLOMVOX_LEGACY_WS_URL = 'wss://wss.aillom.com/ws';

export const AILLOMVOX_DEFAULT_HTTP_ORIGIN = 'https://vox.aillom.com';

/**
 * Providers exposed in the public playground (`aillom-vox` WebSocket `provider` field).
 * The server accepts aliases (case-insensitive); see docs on the dashboard.
 */
export const AILLOMVOX_PUBLIC_PROVIDERS = [
    'aillomvox',
    'aws',
    'gemini',
    'grok',
    'openai',
    'qwen',
    'ultravox',
] as const;

export type AillomVoxPublicProviderId = (typeof AILLOMVOX_PUBLIC_PROVIDERS)[number];

/**
 * When `provider === "aillomvox"`, the gateway selects a TTS stack via `tts_engine`
 * (see `GET /api/providers` → `aillomvox.tts_options`).
 */
export const AILLOMVOX_TTS_ENGINES = [
    'inworld',
    'xai',
    'lmnt',
    'soniox',
    'rime',
    'fish',
] as const;

export type AillomVoxTtsEngineId = (typeof AILLOMVOX_TTS_ENGINES)[number];
