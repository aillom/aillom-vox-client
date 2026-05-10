/**
 * Rewrites `wss.aillom.com` (legacy) to `vox.aillom.com` so old configs keep working.
 */
export declare function migrateLegacyGatewayUrl(url: string): string;
/**
 * Normalizes user input into a WebSocket URL ending with `/ws`.
 * Accepts `wss://…/ws`, `https://vox.aillom.com`, or `wss://vox.aillom.com`.
 * Legacy `https://wss.aillom.com` / `wss://wss.aillom.com/ws` is migrated to **vox**.
 */
export declare function normalizeWebSocketUrl(gatewayUrl?: string): string;
/** Converts a gateway WebSocket base URL into `https://` origin for REST (`/api/*`). */
export declare function httpOriginFromGatewayUrl(gatewayUrl?: string): string;
