"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VOX_PROVIDER_RATECARD = void 0;
exports.VOX_PROVIDER_RATECARD = [
    {
        label: 'AillomVox',
        provider: 'aillomvox',
        ttsEngineHint: 'LMNT · Cartesia · xAI · soniox · rime (standard lanes)',
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
];
