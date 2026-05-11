# Supported AI providers

AillomVox is a **voice AI gateway**. In the WebSocket `config` handshake, set `provider` to one of the realtime providers below. For the current catalog, always prefer the live endpoints:

- `GET https://vox.aillom.com/api/providers` — providers, models and voice catalogs
- `GET https://vox.aillom.com/api/pricing` — public USD/min rate card

From the TypeScript SDK:

```typescript
import { AillomVox } from 'aillom-vox-client';

const providers = await AillomVox.fetchProviders();
const pricing = await AillomVox.fetchPricing();
```

## Provider matrix

Current public production configuration:

| `provider` | Product | Model / stack | USD/min |
| :--- | :--- | :--- | ---: |
| `aillomvox` | AillomVox gateway | GPT-OSS 120B · Whisper · Inworld TTS-2 | **0.04** |
| `aws` | AWS Nova | nova-2-sonic | **0.06** |
| `gemini` | Gemini Live | gemini-3.1-flash-live-preview | **0.06** |
| `qwen` | Qwen Omni | qwen3.5-omni-flash-realtime | **0.06** |
| `grok` | xAI Grok Voice | grok-voice-think-fast-1.0 | **0.10** |
| `openai` | OpenAI Realtime | gpt-realtime-mini | **0.10** |
| `ultravox` | Ultravox | ultravox-70B | **0.10** |

These are public list prices. Credits, negotiated SKUs, account settings and billing adjustments can differ; the billing dashboard is the contract.

## `aillomvox` + `tts_engine`

When `provider` is `aillomvox`, send `tts_engine` in the first JSON config message. The live gateway currently exposes these TTS lanes under `aillomvox.tts_options`:

| `tts_engine` | Role | Public voice count at last verification |
| :--- | :--- | ---: |
| `inworld` | Inworld Realtime TTS-2 | 148 |
| `xai` | xAI TTS / custom voices | 5 |
| `lmnt` | LMNT TTS / custom voices | 62 |
| `soniox` | Soniox realtime TTS | 12 |
| `rime` | Rime AI voices | 117 |
| `fish` | Fish Audio TTS / custom voices | 101 |

Cartesia is intentionally disabled in the public client docs for now. Do not use `aillomvoxmax`; that SKU label is deprecated.

Voice IDs are **not portable** across engines. Always pair `tts_engine` with a `voice` returned for that engine from `/api/providers`.

Example handshake fragment:

```json
{
  "type": "config",
  "apikey": "av_...",
  "provider": "aillomvox",
  "tts_engine": "inworld",
  "voice": "Aanya",
  "language": "en-US",
  "sample_rate": 16000,
  "system_prompt": "You are a concise assistant."
}
```

## Voice cloning

Voice clone is available through `POST /api/voices/clone` and the SDK helper `AillomVox.cloneVoice(...)`.

Operational rule in production:

- The free `$1.00` signup credit can be used for call testing.
- Voice cloning is unlocked only after the user makes at least one paid top-up.
- Clone requests may target enabled providers such as `lmnt`, `qwen`, `xai`, `ultravox`, `inworld`, and `fish`.
- If a provider rejects cloning because of quota/limit/duplicate behavior, the gateway skips that provider and continues with the others when possible.

```typescript
await AillomVox.cloneVoice(audioBlob, apiKey, {
  name: 'Support voice',
  providers: ['lmnt', 'inworld', 'fish'],
  language: 'pt-BR',
  transcription: 'Texto exato falado no audio.',
});
```

## SDK snippet

```typescript
import { AillomVox } from 'aillom-vox-client';

const client = new AillomVox({
  apiKey: process.env.AILLOMVOX_KEY!,
  provider: 'aillomvox',
  ttsEngine: 'inworld',
  voice: 'Aanya',
  language: 'en-US',
  sampleRate: 16000,
  systemPrompt: 'You are a professional assistant.',
  firstMessage: 'Hello! How can I help you today?',
});

client.on('transcript', (m) => console.log(m.role, m.text));
client.on('playback_clear_buffer', () => {
  // Stop scheduled playback: user interrupted the assistant.
});

await client.connect();
```

## Provider notes

| Topic | Detail |
| :--- | :--- |
| Live source of truth | Use `fetchProviders()` and `fetchPricing()` rather than hardcoding voices/prices. |
| Qwen + tools | Realtime Qwen may not emit client `tool_call` events the same way as OpenAI/Gemini; design flows that tolerate answer-only behavior or pick another provider for strict tool pipelines. |
| Cartesia | Disabled in the public docs/client defaults for now. |
| Voice clone | Requires a paid top-up even if the account has signup test credit. |

## Per-provider docs

- [AillomVox / unified stack](providers/AILLOMVOX.md)
- [OpenAI Realtime](providers/OPENAI.md)
- [Gemini Live](providers/GEMINI.md)
- [AWS Nova Sonic](providers/AWS.md)
- [Ultravox](providers/ULTRAVOX.md)
- [Grok](providers/GROK.md)
- [Qwen](providers/QWEN.md)
