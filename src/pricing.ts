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

export const VOX_PROVIDER_RATECARD: readonly VoxProviderRateRow[] = [
    {
        label: 'AillomVox',
        provider: 'aillomvox',
        ttsEngineHint: 'inworld · xai · lmnt · soniox · rime · fish',
        usdPerMinute: 0.04,
        tier: 'Gateway',
        modelSummary: 'Soniox STT · Groq Llama 3.3 70B · selectable TTS',
        badge: 'Best Value',
    },
    { label: 'AWS Nova', provider: 'aws', usdPerMinute: 0.06, tier: 'S2S', modelSummary: 'nova-2-sonic' },
    { label: 'Gemini', provider: 'gemini', usdPerMinute: 0.06, tier: 'S2S', modelSummary: 'gemini-3.1-flash-live-preview' },
    { label: 'Qwen', provider: 'qwen', usdPerMinute: 0.06, tier: 'S2S', modelSummary: 'qwen3.5-omni-flash-realtime' },
    { label: 'Grok', provider: 'grok', usdPerMinute: 0.1, tier: 'S2S', modelSummary: 'grok-voice-think-fast-1.0' },
    { label: 'OpenAI', provider: 'openai', usdPerMinute: 0.1, tier: 'S2S', modelSummary: 'gpt-realtime-mini' },
    { label: 'Ultravox', provider: 'ultravox', usdPerMinute: 0.1, tier: 'Premium', modelSummary: 'ultravox-70B' },
] as const;
