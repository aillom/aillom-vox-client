# Examples

Browser demos and a TypeScript sample for the AillomVox gateway. All WebSocket examples use the production endpoint **`wss://vox.aillom.com/ws`** when not opened from `localhost`. For local gateway development, they fall back to **`ws://localhost:8080/ws`** when the page is served from `localhost` (match your dev server port if different).

## Requirements

- **API key** from the [AillomVox dashboard](https://vox.aillom.com) (`av_…`).
- A **browser** with `getUserMedia` (HTTPS or `localhost`).
- Static hosting for HTML demos — do not open `file://` URLs if the browser blocks mic or WebSocket mixed content; use a local server.

### Run the HTML examples

From the repository root:

```bash
npx --yes serve examples -p 3333
```

Then open e.g. `http://localhost:3333/01-basic/` in your browser.

### Run the TypeScript sample

From the repository root (after `npm install` and `npm run build` in the package root):

```bash
npx --yes tsx examples/sdk-usage.ts
```

By default it imports the SDK from `../src` for development. In your app, use `import { AillomVox } from 'aillom-vox-client'` instead.

## What each example does

| Path | Description |
| :--- | :--- |
| [**sdk-usage.ts**](sdk-usage.ts) | Node-compatible TS: `fetchProviders()`, connect, transcripts, audio chunks, `playback_clear_buffer`, tool results. Set `AILLOMVOX_KEY` or edit the placeholder key. |
| [**01-basic/**](01-basic/) | Minimal connect / mic / PCM playback with **sequential scheduling** and **`playback_clear_buffer`** (barge-in). Good starting point to copy. |
| [**02-advanced-dashboard/**](02-advanced-dashboard/) | Multi-provider UI, tools JSON, state / hangup handling, same gateway URL rules. |
| [**03-smart-home/**](03-smart-home/) | Tool calls (`set_light`, `set_temperature`, `set_security`) with scheduled TTS playback. |
| [**04-customer-support/**](04-customer-support/) | Mock CRM + phone UI; tools `approve_refund`, `add_note`. Sample customer data is fictional. |

## Protocol tips

- First message after connect must be JSON **`type: "config"`** with `apikey`, `provider`, `sample_rate`, etc. See [docs/PROTOCOL.md](../docs/PROTOCOL.md).
- For `provider: "aillomvox"`, set **`tts_engine`** (default **`inworld`** in this SDK — use the live voice catalog) to match the **`voice`** id from **`GET /api/providers`** → `tts_options`.
- On **`playback_clear_buffer`**, stop any queued / scheduled output audio immediately (user interrupted the assistant).
