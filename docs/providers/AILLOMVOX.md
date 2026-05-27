# AillomVox Provider

The default gateway provider. It combines STT, LLM, TTS, recording, tools and failover behind one WebSocket provider id: `aillomvox`.

## Current public stack

| Component | Current stack |
| :--- | :--- |
| STT | Soniox realtime STT lane managed by gateway |
| LLM | Groq Llama 3.3 70B gateway lane |
| TTS | Selectable with `tts_engine`; SDK default is `inworld` |
| List price | `$0.04/min` |

## TTS engines

Use `GET /api/providers` for the live `aillomvox.tts_options` list. Current public lanes are:

- `inworld`
- `xai`
- `lmnt`
- `soniox`
- `rime`
- `fish`

Cartesia is disabled in the public client docs for now. `aillomvoxmax` is deprecated.

## Configuration

```json
{
  "provider": "aillomvox",
  "tts_engine": "inworld",
  "voice": "Aanya",
  "system_prompt": "You are a helpful assistant.",
  "language": "en-US",
  "sample_rate": 16000
}
```

Voice IDs are not portable across `tts_engine` values. Use `fetchProviders()` for the live catalog.

## Voice clone

Voice clone is supported through enabled providers (`lmnt`, `qwen`, `xai`, `ultravox`, `inworld`, `fish`, and others configured server-side). Production requires at least one paid top-up; the free `$1.00` signup credit is for call testing.

## Best for

- Customer support and sales calls
- SIP/Asterisk integrations
- Browser/mobile voice agents with local tools
- High-volume usage that needs one API across multiple realtime providers
