/**
 * Public rate card (USD per **billed** minute of voice usage), aligned with the
 * marketing table on https://vox.aillom.com and `GET /api/pricing`.
 *
 * **Do not treat this as a legal quote** — always confirm charges in the billing
 * dashboard; `GET /api/providers` may expose model metadata but not necessarily
 * your negotiated rates.
 */
export type VoxRateTier = 'Gateway' | 'S2S' | 'Premium';
export interface VoxProviderRateRow {
    /** Row label on the marketing site */
    label: string;
    /** WebSocket handshake `provider` field */
    provider: string;
    /**
     * When `provider === "aillomvox"`, this hints the currently documented
     * TTS lanes. Omit when not applicable.
     */
    ttsEngineHint?: string;
    usdPerMinute: number;
    tier: VoxRateTier;
    /** Short model / stack description from the live site */
    modelSummary: string;
    badge?: string;
}
export declare const VOX_PROVIDER_RATECARD: readonly VoxProviderRateRow[];
