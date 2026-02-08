# Google Gemini (Multimodal)

Leverages `gemini-2.5-flash-native-audio-preview-12-2025` for massive context and multimodal capabilities.

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

| Voice | Style |
| :--- | :--- |
| **Puck** | Soft, higher pitch |
| **Kore** | Soft, higher pitch |
| **Charon** | Deep, confident |
| **Fenrir** | Deep, confident |
| **Aoede** | Confident, higher pitch |

## Features
- **Large Context**: Can process huge system prompts or conversation history.
- **Multimodal**: Can technically process images if sent (though SDK focuses on Audio).
- **Tool Use**: Robust function calling.

## Best For
- **Long Context**: Analyzing documents or long previous conversations.
- **Complex Instructions**: Following very detailed, multi-step system prompts.
