# Qwen (Alibaba Cloud)

Open-source based, highly efficient model (`qwen3-omni-flash-realtime`).

## Configuration

```json
{
  "provider": "qwen",
  "system_prompt": "You are a helpful assistant.",
  "language": "en-US",
  "sample_rate": 16000
}
```

## Voices

Model-dependent. Voice selection depends on the underlying model version.

## Features
- **Cost Effective**: Generally lower cost than OpenAI.
- **Fast**: "Flash" model is optimized for speed.
- **No Tool Support**: Function calling / Client Tools are **not supported** in WebSocket Realtime mode. Use AWS, OpenAI, or Gemini for scenarios requiring tools.

## Best For
- **Cost-Sensitive**: High volume conversational AI.
- **Asian Markets**: Excellent support for Mandarin/English/Asian languages.
