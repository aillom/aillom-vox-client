# 🎙️ AillomVox Public Client

[![npm version](https://img.shields.io/npm/v/aillom-vox-client.svg)](https://www.npmjs.com/package/aillom-vox-client)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org/)

**The Enterprise-Grade Voice AI SDK.** 

Build **Speech-to-Speech**, **Audio-to-Audio**, and **Realtime Multimodal** applications with a single, unified protocol. 
Connect effortlessly to **OpenAI Realtime**, **Gemini Multimodal**, **AWS Nova**, **Qwen**, **Grok**, **UltraVox**, and **AillomVox** native models.

---

## 📦 Installation

```bash
npm install aillom-vox-client
```

## 📚 Documentation
- [**Quick Start (SDK)**](#-quick-start-sdk) - The modern way
- [**Quick Start (WebSocket)**](#-quick-start-websocket) - The low-level way
- [**Examples**](#-examples) - Ready-to-use client implementations
- [**N8N Integration**](#-n8n-node) - Official AillomVox node for n8n
- [**Client Tools**](#-client-tools) - Add custom UI controls to your AI
- [**Voice Catalog**](docs/VOICES.md) - All voices across all providers
- [**Asterisk Integration**](docs/ASTERISK.md) - Complete guide for Asterisk 23/SIP
- [**Protocol Specification**](docs/PROTOCOL.md) - WebSocket messages and binary formats
- [**Supported Providers**](docs/PROVIDERS.md) - AI models and configuration options
- [**Troubleshooting**](docs/TROUBLESHOOTING.md) - Common errors and solutions

---

## 🚀 Key Features
- **Unified API**: Switch between OpenAI, Gemini, and others by changing one string
- **Real-Time Streaming**: Full-duplex WebSocket for sub-500ms latency
- **65 Voices**: Full Inworld TTS 1.5 catalog across 15 languages
- **Robust Audio**: Native PCM 16-bit at **8kHz**, **16kHz**, or **24kHz**
- **Client Tools**: Add custom UI controls (hangup, alerts, navigation) to your AI
- **15 Languages**: en, pt, es, fr, de, it, ja, zh, ko, hi, ar, ru, pl, nl, he
- **Event Driven**: Simple event emitter (`audio`, `transcript`, `interrupt`)
- **Enterprise Security**: Automatic key redaction and sanitized error messages

---

## 💰 Pricing & Performance

Choose the tier that fits your budget. **AillomVox** is optimized for telephony and high-volume use cases.

| Provider | Cost/Min | Tier | Recommended For |
| :--- | :--- | :--- | :--- |
| **AillomVox** | **$0.03** | 🚀 **Best Value** | High volume, Telephony, Support |
| **AillomVox Max** | **$0.06** | ⭐ **Premium** | Highest Quality, Enterprise |
| **Gemini** | $0.06 | Standard | Google Gemini 2.5 Flash. Multimodal |
| **AWS** | $0.06 | Standard | AWS Nova Sonic 2. Enterprise |
| **Qwen** | $0.06 | Standard | Alibaba Qwen Omni 3. Cost-effective |
| **OpenAI** | $0.10 | Premium | GPT Realtime Mini. Logic-heavy |
| **Grok** | $0.10 | Premium | Grok Beta. Witty personality |
| **UltraVox** | $0.10 | Premium | High emotional intelligence |

> **Why AillomVox?**  
> Native optimized pipeline delivers **sub-500ms latency** and **8kHz support** at exceptional cost. 
> - **AillomVox**: Powered by Inworld TTS 1.5 with **65 voices**.
> - **AillomVox Max**: Powered by **Cartesia Sonic 3** for ultra-realistic emotive speech natively supporting 42 languages.

---

## 📱 Examples

This repository contains multiple examples ranging from a minimal connection script to full-featured dashboards and creative use cases.

| Folder | Level | Description |
| :--- | :--- | :--- |
| [`examples/01-basic`](./examples/01-basic) | ⭐ Beginner | Minimal HTML/JS implementation. Connects, sends defaults, streams audio. Perfect for understanding the core protocol. |
| [`examples/02-advanced-dashboard`](./examples/02-advanced-dashboard) | ⭐⭐⭐ Expert | Full-featured UI with Dark Mode. Configures Voice, LLM Provider, Tools, and Visualizations. |
| [`examples/03-smart-home`](./examples/03-smart-home) | ⭐⭐ Creative | A Smart Home Controller simulation. Use voice to "turn on lights" or "adjust temperature" via Tool Calling. |
| [`examples/04-customer-support`](./examples/04-customer-support) | ⭐⭐ Industry | A CRM / Support Agent interface. Demonstrates integration with business data. |

---

## ⚡ Quick Start (SDK)

The easiest way to connect to AillomVox.

```typescript
import { AillomVox } from 'aillom-vox-client';

const client = new AillomVox({
  apiKey: 'av_YOUR_KEY',
  voice: 'Edward',
  debug: true
});

client.on('transcript', (msg) => {
  console.log(`[${msg.role}] ${msg.text}`);
});

client.on('audio', (chunk) => {
  // Play chunk (ArrayBuffer)
});

await client.connect();
```

---

## 🔌 Quick Start (WebSocket)

If you prefer raw WebSockets (e.g. for Python, Go, or minimal JS):

```javascript
const ws = new WebSocket("wss://vox.aillom.com/ws");

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: "config",
    apikey: "YOUR_API_KEY",
    provider: "aillomvox",
    voice: "Edward"
  }));
};

ws.onmessage = (event) => {
  if (event.data instanceof ArrayBuffer) {
    playAudio(event.data);
  }
};
```

---

## 🎤 Voices

AillomVox provides two distinct TTS engines depending on the chosen tier:
1. **AillomVox**: Uses **Inworld TTS 1.5** with 65 voices across 15 languages. 
2. **AillomVox Max**: Uses **Cartesia Sonic 3**, providing hyper-realistic, emotive low-latency voice models across 42 languages.

See the full [Voice Catalog](docs/VOICES.md).

### Top Picks

| Voice | Gender | Style | Best For |
| :--- | :--- | :--- | :--- |
| **Edward** | Male | Fast-talking, emphatic | General purpose (default EN) |
| **Julia** | Female | Quirky, playful | Customer support |
| **Heitor** | Male | Composed, neutral | Portuguese (default PT) |
| **Maitê** | Female | Professional | Portuguese |
| **Ashley** | Female | Warm, natural | Sales, onboarding |
| **Craig** | Male | Refined, articulate | Enterprise, authority |
| **Diego** | Male | Soothing, gentle | Spanish (default ES) |
| **Luna** | Female | Calm, relaxing | Wellness, concierge |

---

## 🛠️ Client Tools

**Client Tools** allow the AI to control your application's UI directly. When the AI decides to execute a tool, your app receives a callback and can respond.

### Registering Tools

```javascript
{
    "provider": "aillomvox",
    "voice": "Edward",
    "tools": [
        {
            "name": "hangup",
            "description": "End the call when user says goodbye.",
            "parameters": { "type": "object", "properties": {} }
        },
        {
            "name": "show_alert",
            "description": "Show alert to user",
            "parameters": {
                "type": "object",
                "properties": {
                    "message": { "type": "string", "description": "Alert message" }
                },
                "required": ["message"]
            }
        }
    ]
}
```

### Handling Tool Calls (Client-Side)

```javascript
socket.onmessage = (event) => {
    if (typeof event.data !== 'string') return;
    const msg = JSON.parse(event.data);
    
    if (msg.type === 'tool_call') {
        console.log(`Tool requested: ${msg.name}`, msg.args);
        
        let result = 'OK';
        if (msg.name === 'hangup') {
            disconnect();
            result = 'Call ended';
        } else if (msg.name === 'show_alert') {
            alert(msg.args.message);
            result = 'Alert displayed';
        }

        // Always respond — AI waits for this (15s timeout)
        socket.send(JSON.stringify({
            type: 'tool_result',
            call_id: msg.call_id,
            result: result
        }));
    }
};
```

---

## 🔧 Advanced Configuration

### Audio Formats

```javascript
{
    sample_rate: 16000,  // 8000 (telephony), 16000 (standard), 24000 (high-quality)
    // Audio is PCM 16-bit little-endian Mono
}
```

### Session Limits

```javascript
{
    max_duration: 300,  // 1-3600 seconds (default: 300 = 5 minutes)
}
```

At 15 seconds remaining, the AI will say the `farewell_message`. At 0 seconds, the connection closes.

### Multi-Language Support

```javascript
{
    language: 'pt-BR',
    voice: 'Heitor',  // or 'Maitê' for female
    system_prompt: 'Você é um assistente da Aillom. Seja conciso.',
    first_message: 'Olá! Como posso ajudar?',
    farewell_message: 'Obrigado por ligar. Até logo!'
}
```

Supported: `en-US`, `pt-BR`, `es-ES`, `fr-FR`, `de-DE`, `it-IT`, `ja-JP`, `ko-KR`, `zh-CN`, `hi-IN`, `ar-SA`, `ru-RU`, `pl-PL`, `nl-NL`, `he-IL`

---

## 🛡️ Security & Limits

### Automatic Sanitization
- All error messages are stripped of sensitive data
- API keys are never exposed in logs
- Client cannot access server-side resources

### Rate Limits
- **Concurrent**: 3 connections per user, 2 per API key
- **Max Duration**: 1-60 minutes per call
- **Default**: 5 minutes per session
- **Behavior**: Warning at 15s remaining, force disconnect at 0s

---

## 🤝 Support

- **Documentation**: [https://vox.aillom.com/docs](https://vox.aillom.com/docs)
- **Issues**: [GitHub Issues](https://github.com/aillom/aillom-vox-client/issues)
- **Email**: contato@aillom.com.br

---

## 📄 License

ISC © Aillom Technologies
