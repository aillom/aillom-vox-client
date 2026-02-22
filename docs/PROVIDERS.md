# Supported AI Providers

AillomVox aggregates top-tier Voice AI providers. Click on a provider to see detailed configuration and examples.

## Provider Index

| Provider | Model | Voices | Best For | Documentation |
| :--- | :--- | :--- | :--- | :--- |
| **AillomVox** | *Groq + Inworld TTS* | 65 voices | **Speed & Telephony**. Lowest latency, 8kHz native. | [Docs](providers/AILLOMVOX.md) |
| **AillomVox Max** | *Groq + Cartesia Sonic 3* | Unlimited | **Hyper-realism**. Emotive fast speech, Voice Cloning. | [Docs](providers/AILLOMVOX.md) |
| **OpenAI** | `gpt-realtime-mini` | 6 voices | **Complex Logic**. Math, coding, strict reasoning. | [Docs](providers/OPENAI.md) |
| **Gemini** | `gemini-2.5-flash` | 5 voices | **Long Context**. Massive memory, complex prompts. | [Docs](providers/GEMINI.md) |
| **AWS** | `nova-2-sonic` | 3 voices | **Enterprise**. High reliability, AWS compliance. | [Docs](providers/AWS.md) |
| **UltraVox** | `ultravox-v0.7` | 2 voices | **Emotion**. High emotional intelligence. | [Docs](providers/ULTRAVOX.md) |
| **Grok** | `grok-beta` | Model-dependent | **Casual/Fun**. Witty, less robotic interactions. | [Docs](providers/GROK.md) |
| **Qwen** | `qwen3-omni` | Model-dependent | **Cost & Asia**. High performance at lower cost. | [Docs](providers/QWEN.md) |

See the complete [Voice Catalog](VOICES.md) for all voices across providers.

## Quick Config Example

```javascript
// Connect to AillomVox
ws.send(JSON.stringify({
  type: "config",
  apikey: "YOUR_API_KEY",
  provider: "aillomvox",
  voice: "Edward",
  language: "en-US",
  sample_rate: 16000,
  system_prompt: "You are a helpful assistant."
}));
```

---

## ⚠️ Known Limitations

| Provider | Limitation | Workaround |
| :--- | :--- | :--- |
| **Qwen** (`qwen3-omni-flash-realtime`) | **Function calling / Client Tools not supported** in WebSocket Realtime mode. The model will respond with text instead of emitting tool calls. | Use **AWS**, **OpenAI**, or **Gemini** for scenarios requiring tools (e.g., `hangup`, `transfer`). |
