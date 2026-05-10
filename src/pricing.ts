/**
 * Public rate card (USD per **billed** minute of voice usage), aligned with the
 * marketing table on https://vox.aillom.com (`providerPricing` in the product SPA).
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
     * When `provider === "aillomvox"`, premium tier is selected via `tts_engine`
     * (e.g. `cartesia` for AillomVox Max stack). Omit when not applicable.
     */
    ttsEngineHint?: string;
    usdPerMinute: number;
    tier: VoxRateTier;
    /** Short model / stack description from the live site */
    modelSummary: string;
}

export const VOX_PROVIDER_RATECARD: readonly VoxProviderRateRow[] = [
    {
        label: 'AillomVox',
        provider: 'aillomvox',
        ttsEngineHint: 'inworld · LMNT · soniox · rime · xai (standard lanes)',
        usdPerMinute: 0.03,
        tier: 'Gateway',
        modelSummary: 'GPT-OSS 120B · Whisper · Inworld 1.5',
    },
    {
        label: 'AillomVox Max',
        provider: 'aillomvox',
        ttsEngineHint: 'cartesia',
        usdPerMinute: 0.06,
        tier: 'Gateway',
        modelSummary: 'Groq · Soniox · Cartesia',
    },
    { label: 'Gemini', provider: 'gemini', usdPerMinute: 0.06, tier: 'S2S', modelSummary: 'gemini-2.5-flash' },
    { label: 'AWS Nova', provider: 'aws', usdPerMinute: 0.06, tier: 'S2S', modelSummary: 'nova-2-sonic' },
    { label: 'Qwen', provider: 'qwen', usdPerMinute: 0.06, tier: 'S2S', modelSummary: 'qwen3.5-omni-flash-realtime' },
    { label: 'OpenAI', provider: 'openai', usdPerMinute: 0.1, tier: 'S2S', modelSummary: 'gpt-realtime-mini' },
    { label: 'Grok', provider: 'grok', usdPerMinute: 0.1, tier: 'S2S', modelSummary: 'grok-beta' },
    { label: 'Ultravox', provider: 'ultravox', usdPerMinute: 0.1, tier: 'Premium', modelSummary: 'ultravox-70B' },
] as const;
