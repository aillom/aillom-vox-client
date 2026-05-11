"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VOX_PROVIDER_RATECARD = void 0;
exports.VOX_PROVIDER_RATECARD = [
    {
        label: 'AillomVox',
        provider: 'aillomvox',
        ttsEngineHint: 'inworld · xai · lmnt · soniox · rime · fish',
        usdPerMinute: 0.04,
        tier: 'Gateway',
        modelSummary: 'GPT-OSS 120B · Whisper · Inworld TTS-2',
        badge: 'Best Value',
    },
    { label: 'AWS Nova', provider: 'aws', usdPerMinute: 0.06, tier: 'S2S', modelSummary: 'nova-2-sonic' },
    { label: 'Gemini', provider: 'gemini', usdPerMinute: 0.06, tier: 'S2S', modelSummary: 'gemini-3.1-flash-live-preview' },
    { label: 'Qwen', provider: 'qwen', usdPerMinute: 0.06, tier: 'S2S', modelSummary: 'qwen3.5-omni-flash-realtime' },
    { label: 'Grok', provider: 'grok', usdPerMinute: 0.1, tier: 'S2S', modelSummary: 'grok-voice-think-fast-1.0' },
    { label: 'OpenAI', provider: 'openai', usdPerMinute: 0.1, tier: 'S2S', modelSummary: 'gpt-realtime-mini' },
    { label: 'Ultravox', provider: 'ultravox', usdPerMinute: 0.1, tier: 'Premium', modelSummary: 'ultravox-70B' },
];
