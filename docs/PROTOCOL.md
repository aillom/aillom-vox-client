# WebSocket Protocol

The AillomVox Gateway uses a WebSocket protocol for full-duplex audio streaming and control messaging.

## Connection

**Endpoint**: `wss://vox.aillom.com/ws`

Do **not** pass your API key in the WebSocket URL query string (`?apiKey=...`): it leaks via logs and intermediaries. The live gateway prefers `x-api-key` during the WebSocket upgrade when your runtime can set headers. Browsers cannot set custom WebSocket headers, so browser clients send `apikey` in the first JSON `config` message. Some legacy integrations document query auth; migrate away from query strings.

> **Legacy hosts**: older integrations used `wss.aillom.com`. The TypeScript SDK (`normalizeWebSocketUrl`) rewrites that host to `vox.aillom.com` automatically; prefer the canonical endpoint above for new code.

> **SDK behavior**: `AillomVox` uses `x-api-key` in Node.js (`authMode: "auto"`) and `config.apikey` in browsers. HTTP APIs (`GET /api/providers`, clone/delete voice, etc.) use `x-api-key` where applicable.

```
Client                              Server
  |                                    |
  |--- WebSocket Connect (GET /ws) --->|
  |<--- 101 Switching Protocols -------|
  |                                    |
  |--- JSON Config (type: "config") -->|  ← MUST be first message
  |                                    |  (Auth + Billing + Provider init)
  |        ~100ms stabilization~       |
  |                                    |
  |--- Binary PCM Audio Chunks ------->|  ← 16-bit LE Mono
  |<--- Binary PCM Audio Chunks -------|  ← AI response audio
  |<--- JSON Events (transcript, etc) -|
  |                                    |
  |--- JSON { type: "hangup" } ------->|  ← or server-initiated
  |<--- WebSocket Close ----------------|
```

## 1. Handshake (Client → Server)

The **first message** must be a flat JSON config object. Sending binary data before this message results in connection termination (code `1008`).

```json
{
  "type": "config",
  "apikey": "av_your_api_key_here",
  "provider": "aillomvox",
  "tts_engine": "inworld",
  "voice": "Aanya",
  "language": "en-US",
  "sample_rate": 16000,
  "system_prompt": "You are a helpful assistant.",
  "first_message": "Hello! How can I help you?",
  "farewell_message": "Thank you for calling. Goodbye!",
  "max_duration": 300,
  "workspace_id": "optional_workspace_id",
  "tools": [
    {
      "name": "hangup",
      "description": "End the call when user says goodbye.",
      "parameters": { "type": "object", "properties": {} }
    }
  ]
}
```

| Field | Required | Type | Description |
| :--- | :--- | :--- | :--- |
| `type` | ✅ | string | Must be `"config"` |
| `apikey` | conditional | string | Required in browsers. Node/server runtimes should prefer the `x-api-key` WebSocket header. |
| `provider` | ✅ | string | e.g. `aillomvox`, `openai`, `gemini`, `aws`, `ultravox`, `grok`, `qwen` (see `GET /api/providers`) |
| `tts_engine` | | string | When `provider` is `aillomvox`. Current public values: `inworld`, `xai`, `lmnt`, `soniox`, `rime`, `fish`. Omit to use the SDK default (`inworld`). |
| `sample_rate` | | number | `8000`, `16000`, or `24000` Hz. Default: `16000`. |
| `system_prompt` | recommended | string | AI persona instructions |
| `voice` | | string | Provider-specific voice ID |
| `language` | | string | BCP 47 locale (e.g., `en-US`, `es-ES`) |
| `first_message` | | string | Greeting spoken on connect |
| `farewell_message` | | string | Message before session close |
| `max_duration` | | number | Session limit in seconds (`30`–`7200`). Default: `300`. |
| `workspace_id` | | string | Optional workspace scope; the API key must be authorized for it. |
| `tools` | | array | Client-side tool definitions |
| `webhook_url` | | string | Optional HTTPS webhook for server-side session events |
| `quality_profile` | | string | Optional AillomVox quality profile hint. |
| `tool_timeout` | | number | Optional client/server tool timeout in milliseconds. |
| `tts_buffer_ms`, `tts_early_start_ms`, `tts_min_chunk_ms`, `accumulator_ms` | | number | Advanced AillomVox timing knobs. |

Session model fields such as `model`, `llm_model`, `model_id` and `tts_model` are stripped by the current gateway. Model/SKU selection is controlled server-side; use `GET /api/providers` to inspect active defaults.

## 2. Audio (Binary Messages)

After the handshake, audio flows as raw binary WebSocket messages in both directions.

- **Format**: PCM 16-bit Signed Integer, Little Endian
- **Channels**: Mono (1 channel)
- **Rate**: Must match `sample_rate` from the handshake
- **Direction**: Full duplex (bidirectional)

> There is no JSON wrapper for audio. If the WebSocket message is binary, it is a raw audio chunk.

## 3. Server → Client Events

### Transcript
```json
{
  "type": "transcript",
  "role": "user",
  "text": "Hello world",
  "final": true
}
```
- `role`: `"user"` or `"assistant"`
- `final`: `true` when the sentence is complete. Only render `final: true` transcripts to avoid UI flickering.

### Tool Call
```json
{
  "type": "tool_call",
  "call_id": "abc123",
  "name": "hangup",
  "args": {}
}
```
Client must respond with a `tool_result` within 15 seconds (see below).

### Playback Clear Buffer
```json
{
  "type": "playback_clear_buffer"
}
```
Sent when the user interrupts the AI. Client **must** immediately flush its audio playback queue.

### Hangup
```json
{
  "type": "hangup"
}
```
Server-initiated session end. Client should stop audio, close socket, and reset UI.

### Error
```json
{
  "type": "error",
  "message": "Invalid API Key"
}
```
Error codes: `unauthorized`, `insufficient_balance`, `max_duration_reached`.

## 4. Client → Server Events

### Tool Result
```json
{
  "type": "tool_result",
  "call_id": "abc123",
  "result": "Order status: shipped"
}
```
**Mandatory** response after receiving a `tool_call`. The AI pauses execution until it receives this. Timeout: 15 seconds.

### Hangup
```json
{
  "type": "hangup"
}
```
Client-initiated session end.

### Text
```json
{
  "type": "text",
  "data": "User typed input or an app-originated text turn"
}
```

### Image
```json
{
  "type": "image",
  "data": "base64-or-provider-specific-image-payload"
}
```

## 5. Session Governance

- **Max Duration**: 30–7200 seconds (default: 300)
- **Farewell Warning**: At 15 seconds remaining, the AI speaks the `farewell_message`
- **Force Close**: At 0 seconds, connection closes with `max_duration_reached`
