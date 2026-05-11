# Google Gemini Live

AillomVox currently exposes Gemini through `gemini-3.1-flash-live-preview`.

## Configuration

```json
{
  "provider": "gemini",
  "voice": "Puck",
  "system_prompt": "You are a helpful assistant.",
  "sample_rate": 24000
}
```

## Voices

Use the live catalog:

```typescript
const voices = await AillomVox.fetchVoices({ provider: 'gemini' });
```

Current public catalog count: 30 voices.

## Best for

- Long-context instructions
- Multilingual and multimodal-oriented flows
- Tool-capable realtime sessions where Gemini behavior fits your use case
