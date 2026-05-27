import { AILLOMVOX_DEFAULT_HTTP_ORIGIN, AILLOMVOX_DEFAULT_WS_URL } from './constants';

/** Query parameter names that must not carry secrets (logs, referrers, browser history). */
const SENSITIVE_WS_QUERY_KEYS = new Set(['apikey', 'api_key', 'x-api-key', 'token', 'secret']);

function warnIfWebSocketUrlLeaksCredentials(url: string): void {
    try {
        const { searchParams } = new URL(url);
        for (const name of searchParams.keys()) {
            if (SENSITIVE_WS_QUERY_KEYS.has(name.toLowerCase())) {
                console.warn(
                    '[AillomVox] Do not put API keys in the WebSocket URL query string. ' +
                        'Use `x-api-key` headers in Node.js or the JSON `config` `apikey` field in browsers. ' +
                        'Query credentials appear in logs, proxies, and analytics.',
                );
                return;
            }
        }
    } catch {
        /* invalid URL — caller may pass partial strings; ignore */
    }
}

/** Legacy WebSocket hostname — rewritten to `vox.aillom.com` for all clients. */
const LEGACY_GATEWAY_HOSTNAME = 'wss.aillom.com';
const CANONICAL_GATEWAY_HOSTNAME = 'vox.aillom.com';

/**
 * Rewrites `wss.aillom.com` (legacy) to `vox.aillom.com` so old configs keep working.
 */
export function migrateLegacyGatewayUrl(url: string): string {
    try {
        const parsed = new URL(url);
        if (parsed.hostname === LEGACY_GATEWAY_HOSTNAME) {
            parsed.hostname = CANONICAL_GATEWAY_HOSTNAME;
            return parsed.toString();
        }
    } catch {
        /* ignore */
    }
    return url;
}

/**
 * Normalizes user input into a WebSocket URL ending with `/ws`.
 * Accepts `wss://…/ws`, `https://vox.aillom.com`, or `wss://vox.aillom.com`.
 * Legacy `https://wss.aillom.com` / `wss://wss.aillom.com/ws` is migrated to **vox**.
 */
export function normalizeWebSocketUrl(gatewayUrl?: string): string {
    if (!gatewayUrl?.trim()) {
        return AILLOMVOX_DEFAULT_WS_URL;
    }
    let u = migrateLegacyGatewayUrl(gatewayUrl.trim());
    if (u.startsWith('https://')) {
        u = `wss://${u.slice('https://'.length)}`;
    } else if (u.startsWith('http://')) {
        u = `ws://${u.slice('http://'.length)}`;
    }
    if (!/\/ws\/?($|\?)/i.test(u)) {
        u = `${u.replace(/\/?$/, '')}/ws`;
    }
    warnIfWebSocketUrlLeaksCredentials(u);
    return u;
}

/** Converts a gateway WebSocket base URL into `https://` origin for REST (`/api/*`). */
export function httpOriginFromGatewayUrl(gatewayUrl?: string): string {
    if (!gatewayUrl?.trim()) {
        return AILLOMVOX_DEFAULT_HTTP_ORIGIN;
    }
    const ws = normalizeWebSocketUrl(gatewayUrl);
    const withoutPath = ws.replace(/\/ws\/?$/i, '').replace(/\/ws\?.*$/i, '');
    return withoutPath.replace(/^wss:\/\//i, 'https://').replace(/^ws:\/\//i, 'http://');
}
