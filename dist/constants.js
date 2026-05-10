"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AILLOMVOX_TTS_ENGINES = exports.AILLOMVOX_PUBLIC_PROVIDERS = exports.AILLOMVOX_DEFAULT_HTTP_ORIGIN = exports.AILLOMVOX_LEGACY_WS_URL = exports.AILLOMVOX_DEFAULT_WS_URL = void 0;
/**
 * Canonical endpoints — keep in sync with `aillom-vox/flow-src/src/constants/publicGateway.ts`.
 */
exports.AILLOMVOX_DEFAULT_WS_URL = 'wss://vox.aillom.com/ws';
/** @deprecated Hostname only — use {@link AILLOMVOX_DEFAULT_WS_URL}. The SDK rewrites this to `vox.aillom.com` in {@link migrateLegacyGatewayUrl}. */
exports.AILLOMVOX_LEGACY_WS_URL = 'wss://wss.aillom.com/ws';
exports.AILLOMVOX_DEFAULT_HTTP_ORIGIN = 'https://vox.aillom.com';
/**
 * Providers exposed in the public playground (`aillom-vox` WebSocket `provider` field).
 * The server accepts aliases (case-insensitive); see docs on the dashboard.
 */
exports.AILLOMVOX_PUBLIC_PROVIDERS = [
    'aillomvox',
    'aws',
    'gemini',
    'grok',
    'openai',
    'qwen',
    'ultravox',
];
/**
 * When `provider === "aillomvox"`, the gateway selects a TTS stack via `tts_engine`
 * (see `GET /api/providers` → `aillomvox.tts_options`).
 */
exports.AILLOMVOX_TTS_ENGINES = [
    'lmnt',
    'cartesia',
    'xai',
    'soniox',
    'rime',
];
