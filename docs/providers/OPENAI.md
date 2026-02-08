# OpenAI Realtime Provider

Direct integration with the `gpt-realtime-mini` model via WebSocket.

## Configuration

```json
{
  "provider": "openai",
  "voice": "alloy",
  "system_prompt": "You are a helpful assistant.",
  "sample_rate": 24000,
  "max_duration": 300
}
```

## Voices

| Voice | Style |
| :--- | :--- |
| **alloy** | Neutral, balanced |
| **ash** | Warm, conversational |
| **coral** | Clear, professional |
| **echo** | Smooth, calm |
| **sage** | Wise, measured |
| **shimmer** | Bright, energetic |

## Features
- **Function Calling**: Full support for tool calling.
- **Native VAD**: Uses OpenAI's server-side voice activity detection.
- **24kHz High Fidelity**: Best used with `sample_rate: 24000`.

## Audio Notes
- Native rate is **24kHz**. 
- If you request 8kHz (telephony), the SDK automatically resamples it, but **24kHz** gives the best results for web calls.

## Best For
- **Complex Reasoning**: Logic-heavy tasks, math, coding assistance.
- **English/Multilingual**: Excellent accent capability.
