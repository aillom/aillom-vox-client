# xAI Grok Voice

AillomVox currently exposes xAI Grok through `grok-voice-think-fast-1.0`.

## Configuration

```json
{
  "provider": "grok",
  "voice": "ara",
  "system_prompt": "You are a helpful assistant.",
  "sample_rate": 16000
}
```

## Voices

Use the live catalog:

```typescript
const voices = await AillomVox.fetchVoices({ provider: 'grok' });
```

Current public catalog count: 5 voices.

## Best for

- Conversational voice agents
- xAI/Grok-specific tone and model behavior
- Flows that benefit from the Grok voice stack
