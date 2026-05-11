# Qwen Omni

AillomVox currently exposes Qwen through `qwen3.5-omni-flash-realtime`.

## Configuration

```json
{
  "provider": "qwen",
  "voice": "Tina",
  "system_prompt": "You are a helpful assistant.",
  "language": "en-US",
  "sample_rate": 16000
}
```

## Voices

Use the live catalog:

```typescript
const voices = await AillomVox.fetchVoices({ provider: 'qwen' });
```

Current public catalog count: 55 voices.

## Notes

Realtime Qwen may not emit client `tool_call` events the same way as OpenAI/Gemini. For strict tool pipelines, use AillomVox, OpenAI, Gemini, or AWS, or design fallback behavior.
