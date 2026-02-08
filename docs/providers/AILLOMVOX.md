# AillomVox Provider

The default, high-performance provider. Uses our proprietary **Hybrid Engine** (Groq LLM + Inworld TTS) to deliver the fastest response times and highest stability at the lowest cost.

## Models

| Component | Model |
| :--- | :--- |
| **STT** | `stt-rt-v4` (Soniox) |
| **LLM** | `openai/gpt-oss-120b` (via Groq) |
| **TTS** | `inworld-tts-1.5-mini` (Inworld) |

## Configuration

```json
{
  "provider": "aillomvox",
  "voice": "Edward",
  "system_prompt": "You are a helpful assistant.",
  "language": "en-US",
  "sample_rate": 16000
}
```

## Available Voices

AillomVox uses **Inworld TTS 1.5** with **65 voices** across 15 languages. All voices support multilingual synthesis.

### English (25 voices)

#### Male
| Voice | Style |
| :--- | :--- |
| **Edward** | Fast-talking, emphatic (default EN) |
| **Dennis** | Smooth, calm, friendly |
| **Alex** | Energetic, expressive |
| **Craig** | Older British, refined, articulate |
| **Mark** | Energetic, rapid delivery |
| **Ronald** | Confident British, deep, gravelly |
| **Shaun** | Friendly, dynamic |
| **Theodore** | Gravelly, time-worn |
| **Timothy** | Lively, upbeat American |
| **Carter** | Mature radio announcer |
| **Blake** | Rich, intimate |
| **Clive** | British, calm, cordial |
| **Dominus** | Robotic, deep, menacing |
| **Hades** | Commanding, gruff narrator |

#### Female
| Voice | Style |
| :--- | :--- |
| **Ashley** | Warm, natural |
| **Deborah** | Gentle, elegant |
| **Elizabeth** | Professional, perfect for narrations |
| **Julia** | Quirky, high-pitched, playful |
| **Olivia** | Young British, upbeat, friendly |
| **Priya** | Even-toned, Indian accent |
| **Sarah** | Fast-talking, curious |
| **Wendy** | Posh British |
| **Luna** | Calm, relaxing, mindfulness |
| **Hana** | Bright, expressive, young |
| **Pixie** | High-pitched, childlike |

### Portuguese (2 voices)
| Voice | Gender | Style |
| :--- | :--- | :--- |
| **Heitor** | Male | Composed, neutral (default PT) |
| **Maitê** | Female | Middle-aged, professional |

### Spanish (4 voices)
| Voice | Gender | Style |
| :--- | :--- | :--- |
| **Diego** | Male | Soothing, gentle (default ES) |
| **Miguel** | Male | Calm, storytelling |
| **Rafael** | Male | Deep, composed, narrations |
| **Lupita** | Female | Vibrant, energetic |

### French (4 voices)
| Voice | Gender | Style |
| :--- | :--- | :--- |
| **Alain** | Male | Deep, smooth, composed |
| **Mathieu** | Male | Nasal quality |
| **Étienne** | Male | Calm, young adult |
| **Hélène** | Female | Smooth, musical, graceful |

### German (2 voices)
| Voice | Gender | Style |
| :--- | :--- | :--- |
| **Josef** | Male | Articulate, announcer-like |
| **Johanna** | Female | Calm, low, smoky |

### Italian (2 voices)
| Voice | Gender | Style |
| :--- | :--- | :--- |
| **Gianni** | Male | Deep, smooth, rapid |
| **Orietta** | Female | Calm, soothing cadence |

### Chinese (4 voices)
| Voice | Gender | Style |
| :--- | :--- | :--- |
| **Yichen** | Male | Calm, flat, young adult |
| **Xiaoyin** | Female | Youthful, gentle, sweet |
| **Xinyi** | Female | Neutral, narrations |
| **Jing** | Female | Energetic, fast-paced |

### Dutch (4 voices)
| Voice | Gender | Style |
| :--- | :--- | :--- |
| **Erik** | Male | Older, weathered edge |
| **Lennart** | Male | Confident, calm, relaxed |
| **Katrien** | Female | Expressive |
| **Lore** | Female | Clear, calm, professional |

### Japanese (2 voices)
| Voice | Gender | Style |
| :--- | :--- | :--- |
| **Satoshi** | Male | Dramatic, expressive |
| **Asuka** | Female | Friendly, young adult |

### Korean (4 voices)
| Voice | Gender | Style |
| :--- | :--- | :--- |
| **Hyunwoo** | Male | Young adult |
| **Seojun** | Male | Clear, deep, mature |
| **Minji** | Female | Energetic, friendly |
| **Yoona** | Female | Gentle, soothing |

### Polish (2 voices)
| Voice | Gender | Style |
| :--- | :--- | :--- |
| **Szymon** | Male | Warm, friendly |
| **Wojciech** | Male | Middle-aged |

### Russian (4 voices)
| Voice | Gender | Style |
| :--- | :--- | :--- |
| **Dmitry** | Male | Deep, commanding |
| **Nikolai** | Male | Deep, theatrical |
| **Svetlana** | Female | Soft, high-pitched |
| **Elena** | Female | Clear, mid-range, smooth |

### Hindi (2 voices)
| Voice | Gender | Style |
| :--- | :--- | :--- |
| **Manoj** | Male | Clear, professional |
| **Riya** | Female | Professional, polished |

### Hebrew (2 voices)
| Voice | Gender | Style |
| :--- | :--- | :--- |
| **Oren** | Male | Steady, podcasts |
| **Yael** | Female | Mid-range, narrations |

### Arabic (2 voices)
| Voice | Gender | Style |
| :--- | :--- | :--- |
| **Omar** | Male | Bright, confident |
| **Nour** | Female | Polished, friendly |

## Default Voice by Language
| Language | Default Voice |
| :--- | :--- |
| English (`en`) | Edward |
| Portuguese (`pt`) | Heitor |
| Spanish (`es`) | Diego |
| All others | Edward |

## Features

- **Smart Fillers**: Automatically plays filler phrases ("Just a moment...", "Let me check...") during LLM processing.
- **Dynamic Voice Switching**: Change voice mid-conversation with the `update_voice` tool.
- **Silence Breakers**: Re-engages the user automatically if they go silent.
- **Jitter Buffer**: Native handling of network instability.
- **Native 8kHz**: Perfect for telephony (SIP/Asterisk) with zero resampling overhead.
- **Adaptive Response Profiles**: Automatically adjusts buffer timing based on response length.
- **Speed Control**: Server-side speed adjustment (0.5x–1.5x, default 1.2x).

## Languages

Supports 15 languages: `en`, `pt`, `es`, `fr`, `de`, `it`, `ja`, `zh`, `ko`, `hi`, `ar`, `ru`, `pl`, `nl`, `he`

## Best For
- **General Purpose**: Customer support, sales, virtual assistants
- **Telephony**: Extremely robust 8kHz support for SIP/Asterisk
- **High Volume**: Lowest cost per minute ($0.03/min)
