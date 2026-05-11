# Voice Catalog

Do not hardcode voice tables unless you are building a fixed demo. The authoritative voice catalog is live:

```typescript
import { AillomVox } from 'aillom-vox-client';

const providers = await AillomVox.fetchProviders();
```

Raw endpoint:

```bash
curl https://vox.aillom.com/api/providers
```

## Current public counts

Last verified against production:

| Scope | Count |
| :--- | ---: |
| Total public voices across provider catalog | 789 |
| `aillomvox.tts_options.inworld` | 148 |
| `aillomvox.tts_options.xai` | 5 |
| `aillomvox.tts_options.lmnt` | 62 |
| `aillomvox.tts_options.soniox` | 12 |
| `aillomvox.tts_options.rime` | 117 |
| `aillomvox.tts_options.fish` | 101 |
| `gemini` | 30 |
| `aws` | 4 |
| `qwen` | 55 |
| `openai` | 11 |
| `grok` | 5 |
| `ultravox` | 239 |

Counts can change as providers add or remove voices.

## Selecting a voice

For `provider: "aillomvox"`, choose a TTS lane and then choose a voice from that lane:

```json
{
  "provider": "aillomvox",
  "tts_engine": "inworld",
  "voice": "Aanya"
}
```

Voice IDs are provider-specific. For example, an Inworld voice ID is not valid for LMNT/Fish/Rime unless that provider also returns the same ID.

## Voice previews

The public API can generate or proxy previews:

```bash
curl -L 'https://vox.aillom.com/api/voices/preview?provider=inworld&voice=Aanya' --output preview.wav
curl -L 'https://vox.aillom.com/api/voices/preview?provider=fish&voice=8ef4a238714b45718ce04243307c57a7' --output preview.mp3
```

## Voice cloning

Voice cloning is available through `AillomVox.cloneVoice(...)` or `POST /api/voices/clone`, but production requires at least one paid top-up. The free `$1.00` signup credit is for call testing.

Recommended clone request:

```typescript
await AillomVox.cloneVoice(audioBlob, apiKey, {
  name: 'Brand support voice',
  providers: ['lmnt', 'inworld', 'fish'],
  language: 'pt-BR',
  transcription: 'Texto exato falado no audio.',
});
```

Provider clone limits are handled server-side: if one provider reports quota/limit/duplicate errors, the gateway can continue with other enabled providers.
