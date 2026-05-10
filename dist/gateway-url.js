"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateLegacyGatewayUrl = migrateLegacyGatewayUrl;
exports.normalizeWebSocketUrl = normalizeWebSocketUrl;
exports.httpOriginFromGatewayUrl = httpOriginFromGatewayUrl;
const constants_1 = require("./constants");
/** Legacy WebSocket hostname — rewritten to `vox.aillom.com` for all clients. */
const LEGACY_GATEWAY_HOSTNAME = 'wss.aillom.com';
const CANONICAL_GATEWAY_HOSTNAME = 'vox.aillom.com';
/**
 * Rewrites `wss.aillom.com` (legacy) to `vox.aillom.com` so old configs keep working.
 */
function migrateLegacyGatewayUrl(url) {
    try {
        const parsed = new URL(url);
        if (parsed.hostname === LEGACY_GATEWAY_HOSTNAME) {
            parsed.hostname = CANONICAL_GATEWAY_HOSTNAME;
            return parsed.toString();
        }
    }
    catch {
        /* ignore */
    }
    return url;
}
/**
 * Normalizes user input into a WebSocket URL ending with `/ws`.
 * Accepts `wss://…/ws`, `https://vox.aillom.com`, or `wss://vox.aillom.com`.
 * Legacy `https://wss.aillom.com` / `wss://wss.aillom.com/ws` is migrated to **vox**.
 */
function normalizeWebSocketUrl(gatewayUrl) {
    if (!gatewayUrl?.trim()) {
        return constants_1.AILLOMVOX_DEFAULT_WS_URL;
    }
    let u = migrateLegacyGatewayUrl(gatewayUrl.trim());
    if (u.startsWith('https://')) {
        u = `wss://${u.slice('https://'.length)}`;
    }
    else if (u.startsWith('http://')) {
        u = `ws://${u.slice('http://'.length)}`;
    }
    if (!/\/ws\/?($|\?)/i.test(u)) {
        u = `${u.replace(/\/?$/, '')}/ws`;
    }
    return u;
}
/** Converts a gateway WebSocket base URL into `https://` origin for REST (`/api/*`). */
function httpOriginFromGatewayUrl(gatewayUrl) {
    if (!gatewayUrl?.trim()) {
        return constants_1.AILLOMVOX_DEFAULT_HTTP_ORIGIN;
    }
    const ws = normalizeWebSocketUrl(gatewayUrl);
    const withoutPath = ws.replace(/\/ws\/?$/i, '').replace(/\/ws\?.*$/i, '');
    return withoutPath.replace(/^wss:\/\//i, 'https://').replace(/^ws:\/\//i, 'http://');
}
