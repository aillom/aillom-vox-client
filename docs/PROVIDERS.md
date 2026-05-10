# Supported AI providers

AillomVox is a **gateway**: you pick a `provider` in the WebSocket `config` handshake. The authoritative catalog (models, nested voices, TTS options for `aillomvox`) is returned by:

`GET https://vox.aillom.com/api/providers` (no API key required for the public catalog; pass `x-api-key` when using `workspace_id`).

From the TypeScript SDK:

```typescript
import { AillomVox } from 'aillom-vox-client';

const catalog = await AillomVox.fetchProviders();
console.log(catalog);
```

## Provider matrix (WebSocket `provider` field)

These ids match the **public playground** in the `aillom-vox` dashboard (`flow-src`).

| `provider` | Product (gateway label) | Notes |
| :--- | :--- | :--- |
| `aillomvox` | AillomVox (unified) | Set `tts_engine` to choose the TTS stack (see below). LLM tier comes from your workspace / gateway config. |
| `gemini` | Google Gemini Live | Multimodal / long-context oriented. |
| `aws` | AWS Nova Sonic | Enterprise / AWS ecosystem. |
| `qwen` | Alibaba Qwen Omni | Strong multilingual; check [limitations](PROVIDERS.md#provider-notes) for tools. |
| `openai` | OpenAI GPT Realtime | Best for heavy tool-use / reasoning paths. |
| `grok` | xAI Grok Voice | Distinct style; voices from xAI catalog. |
| `ultravox` | Ultravox | STS stack with expressive audio. |

### Public list price (USD / billed minute)

Same numbers as the [live marketing table](https://vox.aillom.com) (`providerPricing`). For programmatic access, the npm package exports **`VOX_PROVIDER_RATECARD`** from `aillom-vox-client/dist/pricing.js` (see `src/pricing.ts`). **Your invoice may differ** (credits, bundles, negotiated SKUs) — use the billing dashboard as the contract.

| Product | `provider` | `tts_engine` (gateway only) | Tier | USD/min | Model / stack (site copy) |
| :--- | :--- | :--- | :--- | ---: | :--- |
| AillomVox | `aillomvox` | Standard lanes (`inworld`, `lmnt`, `rime`, `soniox`, `xai`, …) | Gateway | **0.03** | GPT-OSS 120B · Whisper · Inworld 1.5 |
| AillomVox Max | `aillomvox` | **`cartesia`** (Cartesia Sonic-class path) | Gateway | **0.06** | Groq · Soniox · Cartesia |
| Gemini | `gemini` | — | S2S | **0.06** | gemini-2.5-flash |
| AWS Nova | `aws` | — | S2S | **0.06** | nova-2-sonic |
| Qwen | `qwen` | — | S2S | **0.06** | qwen3.5-omni-flash-realtime |
| OpenAI | `openai` | — | S2S | **0.10** | gpt-realtime-mini |
| Grok | `grok` | — | S2S | **0.10** | grok-beta |
| Ultravox | `ultravox` | — | Premium | **0.10** | ultravox-70B |

### Aliases & billing labels

Usage logs may show normalized or marketing ids (`aillomvoxmax`, `google`, etc.). The dashboard documents aliases; treat `GET /api/providers` plus your account’s enabled SKUs as source of truth for **pricing**.

## `aillomvox` + `tts_engine`

When `provider` is `aillomvox`, send **`tts_engine`** in the first JSON message (same level as `voice`, `language`, …). The gateway loads the voice list for that engine from `GET /api/providers` → `aillomvox.tts_options`.

| `tts_engine` | Role |
| :--- | :--- |
| `inworld` | Inworld voices (telephony-friendly catalog). |
| `cartesia` | Cartesia Sonic-class voices (premium track). |
| `xai` | xAI TTS lane. |
| `lmnt` | LMNT. |
| `soniox` | Soniox. |
| `rime` | Rime AI. |

Example handshake fragment:

```json
{
  "type": "config",
  "apikey": "av_…",
  "provider": "aillomvox",
  "tts_engine": "inworld",
  "voice": "Heitor",
  "sample_rate": 16000,
  "system_prompt": "You are a concise assistant for US English callers."
}
```

## SDK snippet

```typescript
import { AillomVox } from 'aillom-vox-client';

const client = new AillomVox({
  apiKey: process.env.AILLOMVOX_KEY!,
  provider: 'aillomvox',
  ttsEngine: 'inworld',
  voice: 'Heitor',
  language: 'en-US',
  systemPrompt: 'You are a professional assistant.',
  firstMessage: 'Hello! How can I help you today?',
  gatewayUrl: 'wss://vox.aillom.com/ws', // optional — this is already the default
});

client.on('transcript', (m) => console.log(m.role, m.text));
client.on('playback_clear_buffer', () => {
  /* stop scheduled TTS playback — user interrupted */
});

await client.connect();
```

## Provider notes

| Topic | Detail |
| :--- | :--- |
| Qwen + tools | Realtime Qwen may not emit client `tool_call` events the same way as OpenAI/Gemini; design flows that tolerate “answer-only” behavior or pick another provider for strict tool pipelines. |
| Voice lists | Prefer loading voices from `fetchProviders()` / dashboard rather than hardcoding; providers add voices over time. |
| Rates | Use the [rate card](#public-list-price-usd--billed-minute) above + billing; list prices track `vox.aillom.com`. |

## Per-provider docs (deep dives)

- [AillomVox / unified stack](providers/AILLOMVOX.md)
- [OpenAI Realtime](providers/OPENAI.md)
- [Gemini Live](providers/GEMINI.md)
- [AWS Nova Sonic](providers/AWS.md)
- [Ultravox](providers/ULTRAVOX.md)
- [Grok](providers/GROK.md)
- [Qwen](providers/QWEN.md)
