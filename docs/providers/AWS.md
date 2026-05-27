# AWS Nova Sonic

AillomVox currently exposes AWS Nova through `amazon.nova-2-sonic-v1:0`.

## Configuration

```json
{
  "provider": "aws",
  "voice": "camila",
  "system_prompt": "You are a helpful assistant.",
  "sample_rate": 16000
}
```

## Voices

Use the live catalog:

```typescript
const voices = await AillomVox.fetchVoices({ provider: 'aws' });
```

Current public catalog count: 16 voices.

## Best for

- AWS-oriented enterprise environments
- Stable speech-to-speech sessions
- Tool-capable workflows where AWS behavior is preferred
