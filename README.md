# AillomVox client (TypeScript)

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org/)

Official **browser + Node.js** SDK for [AillomVox](https://vox.aillom.com): one WebSocket to the gateway (`wss://vox.aillom.com/ws`), PCM16 streaming, transcripts, tools, and REST helpers for the public catalog (`GET /api/providers`) and pricing (`GET /api/pricing`).

Companion server, dashboard, and adapter code ship from the Vox product monorepo; **this** repository is only the npm client surface.

---

## Installation

```bash
npm install aillom-vox-client
```

## Security considerations

- **API keys are secrets.** Never commit real keys, never paste them into public tickets or client-side source that ships to browsers unless you accept that end users can extract them.
- **Browser apps:** a key embedded in frontend JavaScript or Web apps is visible in DevTools and bundled files. Safer patterns: your **backend** exchanges a session cookie or a **short-lived token** for voice access, or proxies the WebSocket with the real key on the server.
- **Do not put `apikey` in the WebSocket URL** (e.g. `wss://.../ws?apiKey=...`). That string is prone to leaking via server logs, reverse proxies, and referrer headers. The SDK uses `x-api-key` headers in Node.js and falls back to the first JSON **`config.apikey`** field in browsers, where custom WebSocket headers are unavailable.
- **`debug: true`:** logs structured config with `apikey` **redacted**, but may still log other inbound JSON; transcripts can contain **PII**. Keep `debug` off in production.
- **TLS:** use **`wss://`** against production (`wss://vox.aillom.com/ws`), not `ws://`, except on trusted local networks.
- **User data:** voice audio and transcripts flow through the gateway; document your own privacy policy and minimize what you log on the client.

## Documentation in this repo

| Doc | Purpose |
| :--- | :--- |
| [docs/PROTOCOL.md](docs/PROTOCOL.md) | WebSocket lifecycle, handshake JSON, PCM rules |
| [docs/PROVIDERS.md](docs/PROVIDERS.md) | Provider matrix, **public USD/min rate card**, `tts_engine` for `aillomvox` |
| [docs/VOICES.md](docs/VOICES.md) | Voice catalog notes |
| [docs/TOOLS.md](docs/TOOLS.md) | Client-side tools |
| [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Common failures |

Hosted docs: `https://vox.aillom.com/docs`

---

## What changed in v2.1

- The canonical WebSocket endpoint is **`wss://vox.aillom.com/ws`**. If you still have `wss://wss.aillom.com/ws` (or `https://wss.aillom.com`), the SDK migrates the host automatically via `normalizeWebSocketUrl()` and `migrateLegacyGatewayUrl()` — you can drop the legacy host from config whenever you like.
- `gatewayUrl` accepts either a WebSocket URL **or** an HTTPS origin; both are normalized.
- Auth now matches the live gateway: Node.js uses `x-api-key`; browser sessions keep using `config.apikey`.
- New helpers: `AillomVox.fetchProviders({ includeVoices })`, `AillomVox.fetchPricing()`, `AillomVox.fetchVoices()`, `AillomVox.fetchVoicePreview()`, `AillomVox.deleteVoice()`, `AillomVox.cloneVoiceDetailed()`, `sendHangup()`, `sendText()`, and `sendImage()`.
- Events: `playback_clear_buffer` (barge-in), `state`, `control`, and `raw` for advanced logging.
- Config: `workspaceId`, `firstMessage`, `farewellMessage`, `ttsEngine` (for `provider: 'aillomvox'`), and advanced timing knobs. Per-session `model` overrides are ignored by the current gateway; use `fetchProviders()` to inspect server defaults.

---

## Quick start

```typescript
import { AillomVox } from 'aillom-vox-client';

const client = new AillomVox({
  apiKey: process.env.AILLOMVOX_KEY!,
  provider: 'aillomvox',
  ttsEngine: 'inworld',
  voice: 'Aanya',
  language: 'en-US',
  sampleRate: 16000,
  systemPrompt: 'You are a concise, professional assistant.',
  firstMessage: 'Hello! How can I help you today?',
});

client.on('transcript', (t) => console.log(t.role, t.text));
client.on('audio', (pcm) => {
  /* Int16 LE mono — play or forward */
});
client.on('playback_clear_buffer', () => {
  /* Flush scheduled playback — user interrupted assistant */
});

await client.connect();
```

### Load the live provider + voice tree

```typescript
import { AillomVox } from 'aillom-vox-client';

const catalog = await AillomVox.fetchProviders({ includeVoices: false });
const pricing = await AillomVox.fetchPricing();
console.log({ catalog, pricing });
```

---

### List pricing (USD / minute)

Published alongside the [marketing site](https://vox.aillom.com); full table in [docs/PROVIDERS.md](docs/PROVIDERS.md). The SDK exports the same rows as data:

```typescript
import { VOX_PROVIDER_RATECARD } from 'aillom-vox-client';

for (const row of VOX_PROVIDER_RATECARD) {
  console.log(row.label, row.provider, row.usdPerMinute);
}
```

The live endpoint is the preferred source for public list prices. Invoices can differ (credits, negotiated SKUs). Use the product billing UI as the contract.


### Current public providers and prices

Use `AillomVox.fetchPricing()` for the live table. Current public list prices:

| Provider | Model / stack | USD/min |
| :--- | :--- | ---: |
| `aillomvox` | Soniox STT · Groq Llama 3.3 70B · selectable TTS | **0.04** |
| `aws` | nova-2-sonic | **0.06** |
| `gemini` | gemini-3.1-flash-live-preview | **0.06** |
| `qwen` | qwen3.5-omni-flash-realtime | **0.06** |
| `grok` | grok-voice-think-fast-1.0 | **0.10** |
| `openai` | gpt-realtime-mini | **0.10** |
| `ultravox` | ultravox-70B | **0.10** |

For `provider: 'aillomvox'`, current TTS engines are `inworld`, `xai`, `lmnt`, `soniox`, `rime`, and `fish`. Cartesia is disabled in the public client docs for now; `aillomvoxmax` is deprecated.

---

## Raw WebSocket (no SDK)

```javascript
const ws = new WebSocket('wss://vox.aillom.com/ws');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'config',
    apikey: 'YOUR_API_KEY',
    provider: 'aillomvox',
    tts_engine: 'inworld',
    voice: 'Aanya',
    language: 'en-US',
    sample_rate: 16000,
    system_prompt: 'You are a helpful assistant.',
  }));
};

ws.onmessage = (event) => {
  if (event.data instanceof ArrayBuffer) {
    /* PCM chunk */
  }
};
```

---

## Examples

See **[examples/README.md](examples/README.md)** for how to run the browser demos and the TypeScript sample (`npx serve`, `tsx`, API keys).

| Path | Description |
| :--- | :--- |
| [examples/sdk-usage.ts](examples/sdk-usage.ts) | TypeScript sample with catalog fetch + handlers |
| [examples/01-basic/](examples/01-basic/) | Minimal browser demo |
| [examples/02-advanced-dashboard/](examples/02-advanced-dashboard/) | Larger UI example |
| [examples/03-smart-home/](examples/03-smart-home/) | Tool-calling illustration |
| [examples/04-customer-support/](examples/04-customer-support/) | Support-style UI |

---

## Voice clone (REST)

`AillomVox.cloneVoice(blob, apiKey, { gatewayUrl, workspaceId, providers, language, transcription })` posts to `/api/voices/clone` with `x-api-key` and returns the primary `voice_id`. Use `cloneVoiceDetailed()` when you need the per-provider clone result, and `deleteVoice()` to remove a workspace-owned clone. Production voice cloning is unlocked after the user's first paid top-up; the free $1.00 signup credit is for call testing.

---

## n8n

Community node under [integrations/n8n-nodes-aillomvox/](integrations/n8n-nodes-aillomvox/) (REST operations).

---

## License

ISC © Aillom Technologies
