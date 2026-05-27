# Ultravox

AillomVox currently exposes Ultravox as `fixie-ai/ultravox-v0.7` in `GET /api/providers`.

## Configuration

```json
{
  "provider": "ultravox",
  "voice": "Aakash-Hindi",
  "system_prompt": "You are a helpful assistant.",
  "language": "en-US",
  "sample_rate": 16000
}
```

## Voices

Use the live catalog:

```typescript
const voices = await AillomVox.fetchVoices({ provider: 'ultravox' });
```

Current public catalog count: 238 voices.

## Voice clone

Ultravox can be included in clone attempts from the gateway. If the upstream provider returns clone limits/quota/duplicate errors, the gateway should skip that provider and continue with the others when possible.

## Best for

- Expressive speech-to-speech agents
- Broad voice catalog requirements
- Workloads where Ultravox model behavior is preferred
