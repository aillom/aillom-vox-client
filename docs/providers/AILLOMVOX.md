# AillomVox Provider

The default, high-performance provider. Uses our proprietary **Hybrid Engine** (Groq LLM + **LMNT** text-to-speech by default; other TTS lanes via `tts_engine`).

## Models

| Component | Model |
| :--- | :--- |
| **STT** | `stt-rt-v4` (Soniox) |
| **LLM** | `openai/gpt-oss-120b` (via Groq) |
| **TTS** | **LMNT** default lane; other stacks: `cartesia`, `xai`, `soniox`, `rime` (see `/api/providers`). |

## Configuration

```json
{
  "provider": "aillomvox",
  "tts_engine": "lmnt",
  "voice": "lily",
  "system_prompt": "You are a helpful assistant.",
  "language": "en-US",
  "sample_rate": 16000
}
```

Use **`GET /api/providers`** for the live list of `tts_options` and **`voice`** IDs for each engine — they are **not** interchangeable across engines.

## Voices

See **[VOICES.md](../VOICES.md)** for catalog notes. The default path is **LMNT**; an **appendix** documents the legacy **Inworld** name list for older configs that still set `tts_engine: "inworld"`.

## Features

- **Smart Fillers**: Automatically plays filler phrases ("Just a moment...", "Let me check...") during LLM processing.
- **Dynamic Voice Switching**: Change voice mid-conversation with the `update_voice` tool.
- **Silence Breakers**: Re-engages the user automatically if they go silent.
- **Jitter Buffer**: Native handling of network instability.
- **Native 8kHz**: Perfect for telephony (SIP/Asterisk) with zero resampling overhead.
- **Adaptive Response Profiles**: Automatically adjusts buffer timing based on response length.
- **Speed Control**: Server-side speed adjustment — range depends on active `tts_engine` (see gateway docs).

## Languages

Supported locales follow the active STT/TTS stacks; multilingual synthesis behavior depends on **`tts_engine`** and model. Prefer **`language`** plus voices from **`GET /api/providers`** over hard-coded defaults.

## Best For

- **General Purpose**: Customer support, sales, virtual assistants
- **Telephony**: Extremely robust 8kHz support for SIP/Asterisk
- **High Volume**: Lowest list price on the unified gateway is **$0.03/min** (standard `aillomvox` TTS lanes). **AillomVox Max** (Cartesia Sonic-class path, typically `tts_engine: "cartesia"`) is **$0.06/min** on the public rate card — confirm on your billing dashboard.
