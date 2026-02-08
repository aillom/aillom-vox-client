# WebSocket Protocol

The AillomVox Gateway uses a WebSocket protocol for full-duplex audio streaming and control messaging.

## Connection

**Endpoint**: `wss://vox.aillom.com/ws`

> **Note**: Authentication is performed in-band (inside the first message), not via HTTP headers or query params.

## Message Flow

```
Client                              Server
  |                                    |
  |--- WebSocket Connect (GET /ws) --->|
  |<--- 101 Switching Protocols -------|
  |                                    |
  |--- JSON Config (type: "config") -->|  ← MUST be first message
  |                                    |  (Auth + Billing + Provider init)
  |        ~500ms stabilization~       |
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
  "voice": "Edward",
  "language": "en-US",
  "sample_rate": 16000,
  "system_prompt": "You are a helpful assistant.",
  "first_message": "Hello! How can I help you?",
  "farewell_message": "Thank you for calling. Goodbye!",
  "max_duration": 300,
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
| `apikey` | ✅ | string | Your AillomVox API key |
| `provider` | ✅ | string | `aillomvox`, `openai`, `gemini`, `aws`, `ultravox`, `grok`, `qwen` |
| `sample_rate` | ✅ | number | `8000`, `16000`, or `24000` Hz |
| `system_prompt` | ✅ | string | AI persona instructions |
| `voice` | | string | Provider-specific voice ID |
| `language` | | string | Locale code (e.g., `en-US`, `pt-BR`) |
| `first_message` | | string | Greeting spoken on connect |
| `farewell_message` | | string | Message before session close |
| `max_duration` | | number | Session limit in seconds (60–3600) |
| `tools` | | array | Client-side tool definitions |

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

## 5. Session Governance

- **Max Duration**: 60–3600 seconds (default: 300)
- **Farewell Warning**: At 15 seconds remaining, the AI speaks the `farewell_message`
- **Force Close**: At 0 seconds, connection closes with `max_duration_reached`
