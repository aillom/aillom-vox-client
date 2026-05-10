# 📞 Asterisk 23 Integration Guide - AillomVox

Complete guide for integrating **Asterisk 23** with **AillomVox** for real-time Voice AI calls.

---

## 🎯 Overview

AillomVox provides **two integration architectures** for Asterisk:

### 1. **Direct Mode** (Simple)
```
Asterisk → AudioSocket → AillomVox Gateway → AI Provider
```
✅ Simple voice conversations  
❌ No client tools (transfer, AMI control)

### 2. **Middleware Mode** (Advanced)
```
Asterisk → AudioSocket → Node.js Middleware → AillomVox Gateway
                ↓ AMI/ARI
```
✅ Client tools enabled (transfer, hangup, dial)  
✅ Full Asterisk control from AI

---

## 📋 Prerequisites

### Asterisk Requirements
- **Asterisk 23** (or 18+)
- **AudioSocket** module compiled and enabled
- **API Key** for AillomVox gateway

### Verify AudioSocket Module
```bash
asterisk -rx "module show like audiosocket"
```

Expected output:
```
Module                         Description
res_audiosocket.so             AudioSocket
```

If not loaded:
```bash
# Load module
asterisk -rx "module load res_audiosocket"

# Make it persistent
echo "load = res_audiosocket.so" >> /etc/asterisk/modules.conf
```

---

## 🔐 Authentication

AillomVox uses **API Key** authentication for security and usage tracking.

### Getting Your API Key

Get your API key from the AillomVox dashboard or contact support.

### Storing API Key

Store in `extensions.conf`:

```ini
[globals]
AILLOM_API_KEY=your-api-key-here
```

---

## 🏗️ Architecture 1: Direct Mode (Simple)

### When to Use
- Simple AI voice conversations
- No need to transfer calls or control Asterisk
- Just want AI to answer and respond

### Dialplan Configuration

```ini
[from-internal]

; Call extension 6000 to talk to AI
exten => 6000,1,NoOp(AillomVox Direct Mode)
 same => n,Set(WS_URL=ws://vox.aillom.com/ws?apiKey=${AILLOM_API_KEY})
 same => n,Set(CONFIG={"provider":"aillomvox","tts_engine":"lmnt","voice":"lily","language":"en-US","system_prompt":"You are a concise assistant.","first_message":"Hello! How can I help?","sample_rate":8000})
 same => n,Answer()
 same => n,AudioSocket(${WS_URL},${CONFIG})
 same => n,Hangup()
```

### Configuration JSON

```json
{
  "provider": "aillomvox",
  "tts_engine": "lmnt",
  "voice": "lily",
  "language": "en-US",
  "system_prompt": "You are a helpful virtual assistant.",
  "first_message": "Hello! How can I help?",
  "farewell_message": "Thank you for calling. Goodbye!",
  "sample_rate": 8000,
  "max_duration": 300
}
```

**Note**: No `tools` array needed in Direct Mode.

---

## 🏗️ Architecture 2: Middleware Mode (Advanced)

### When to Use
- AI needs to **transfer** calls to extensions
- AI needs to **hangup** via AMI (not just end conversation)
- AI needs to **dial** external numbers
- Advanced call control

### Architecture
```
Asterisk → AudioSocket (port 9000) → Node.js Middleware
                                            ↓
                                       AMI/ARI Control
                                            ↓
                                     AillomVox Gateway
```

### Step 1: Install Dependencies

```bash
npm install aillom-vox-client asterisk-manager
```

### Step 2: Create Middleware (`asterisk-bridge.js`)

```javascript
const net = require('net');
const AillomVoxClient = require('aillom-vox-client');
const AMI = require('asterisk-manager');

// AMI connection for Asterisk control
const ami = new AMI(5038, 'localhost', 'admin', 'secret', true);

ami.keepConnected();

// AudioSocket server (receives from Asterisk)
const server = net.createServer((socket) => {
    console.log('[Bridge] New call from Asterisk');

    // Connect to AillomVox
    const client = new AillomVoxClient({
        apiKey: process.env.AILLOM_API_KEY,
        url: 'wss://vox.aillom.com/ws'
    });

    // Register client tools
    client.connect({
        provider: 'aillomvox',
        voice: 'lily',
        language: 'en-US',
        system_prompt: 'You are a helpful assistant. If the caller asks, transfer to extension 100 or end the call.',
        sample_rate: 8000,
        tools: [{
            name: 'hangup',
            description: 'End the call',
            parameters: { type: 'object', properties: {} }
        }, {
            name: 'transfer',
            description: 'Transfer call to extension',
            parameters: {
                type: 'object',
                properties: {
                    extension: { type: 'string', description: 'Target extension' }
                },
                required: ['extension']
            }
        }]
    });

    // Handle tool calls from AI
    client.on('tool_call', async (tool) => {
        console.log(`[Tool] AI called: ${tool.name}`, tool.args);
        
        if (tool.name === 'hangup') {
            console.log('[Tool] Hanging up call');
            socket.end();
            client.disconnect();
            return 'Call ended';
        }
        
        if (tool.name === 'transfer') {
            const ext = tool.args.extension;
            console.log(`[Tool] Transferring to ${ext}`);
            
            // Use AMI to transfer (implement based on your channel tracking)
            ami.action({
                action: 'redirect',
                channel: 'PJSIP/1234-00000001', // Track this from call setup
                exten: ext,
                context: 'from-internal',
                priority: 1
            });
            
            return `Transferred to extension ${ext}`;
        }
    });

    // Pipe audio: Asterisk ↔ AillomVox
    socket.on('data', (data) => {
        // Parse AudioSocket protocol if needed, then send PCM
        client.sendAudio(data);
    });

    client.on('audio', (pcmData) => {
        socket.write(pcmData);
    });

    socket.on('end', () => {
        console.log('[Bridge] Asterisk closed connection');
        client.disconnect();
    });
});

server.listen(9000, '127.0.0.1', () => {
    console.log('[Bridge] Listening on 127.0.0.1:9000');
});
```

### Step 3: Configure Asterisk

```ini
[from-internal]

; Call extension 7000 using middleware (with client tools)
exten => 7000,1,NoOp(AillomVox Middleware Mode)
 same => n,Set(CONFIG={"provider":"aillomvox"})
 same => n,Answer()
 same => n,AudioSocket(127.0.0.1:9000,${CONFIG})
 same => n,Hangup()
```

### Step 4: Run Middleware

```bash
AILLOM_API_KEY=your-api-key node asterisk-bridge.js
```

### Step 5: Test

Call extension 7000 and say:
- "Transfer me to extension 100" → AI calls `transfer` tool
- "Goodbye" → AI calls `hangup` tool

---

## 🎙️ Audio Format

### AudioSocket Protocol
- **Format**: PCM 16-bit signed little-endian (`slin`)
- **Sample Rate**: 8000 Hz (telephony standard)
- **Channels**: 1 (mono)
- **Encoding**: `pcm_s16le`

### Codec Conversion (ulaw/alaw → slin)

**In Brazil and most countries**, SIP trunks use:
- **ulaw** (G.711μ) — common in North America and Brazil
- **alaw** (G.711a) — common in Europe

**Asterisk converts automatically**:
```
Trunk SIP (ulaw/alaw) → Asterisk → slin → AudioSocket → AillomVox
```

No extra codec configuration is required — Asterisk performs conversion transparently.

### Forcing Codec (Optional)

If you have audio issues, force the codec:

```ini
exten => 6000,1,Set(CHANNEL(audioreadformat)=slin)
 same => n,Set(CHANNEL(audiowriteformat)=slin)
 same => n,Answer()
 same => n,AudioSocket(...)
```

This ensures Asterisk always delivers 16-bit PCM to AudioSocket.

---

## 🌍 Multi-Provider Examples (Direct Mode)

### AillomVox (Best for Telephony)

```ini
exten => 7001,1,Set(CONFIG={"provider":"aillomvox","tts_engine":"lmnt","voice":"lily","sample_rate":8000})
 same => n,AudioSocket(ws://vox.aillom.com/ws?apiKey=${AILLOM_API_KEY},${CONFIG})
```

**Why?** Lowest latency, optimized for 8kHz, $0.03/min.

### Gemini 2.5 Flash

```ini
exten => 7002,1,Set(CONFIG={"provider":"gemini","voice":"Puck","sample_rate":8000})
 same => n,AudioSocket(ws://vox.aillom.com/ws?apiKey=${AILLOM_API_KEY},${CONFIG})
```

**Why?** Multimodal, fast, $0.06/min.

### OpenAI Realtime

```ini
exten => 7003,1,Set(CONFIG={"provider":"openai","voice":"shimmer","sample_rate":8000})
 same => n,AudioSocket(ws://vox.aillom.com/ws?apiKey=${AILLOM_API_KEY},${CONFIG})
```

**Why?** Best for complex reasoning, $0.10/min.

---

## ⚠️ Troubleshooting

### Problem: "Module audiosocket not loaded"

```bash
asterisk -rx "module load res_audiosocket"
echo "load = res_audiosocket.so" >> /etc/asterisk/modules.conf
```

### Problem: "Connection refused"

**Direct Mode**: Check firewall, verify server is running  
**Middleware Mode**: Ensure middleware is running on `127.0.0.1:9000`

```bash
# Test direct connection
curl -I https://vox.aillom.com/health

# Test middleware
netstat -tuln | grep 9000
```

### Problem: "No audio"

Force codec:
```ini
exten => 6000,1,Set(CHANNEL(audioreadformat)=slin)
 same => n,Set(CHANNEL(audiowriteformat)=slin)
 same => n,AudioSocket(...)
```

---

## 📊 Configuration Options

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `provider` | string | `aillomvox`, `gemini`, `openai`, `qwen`, `grok`, `aws`, `ultravox` | **Required** |
| `voice` | string | Voice ID (provider-specific) | **Required** |
| `language` | string | BCP 47 tag (e.g. `en-US`, `es-ES`) | `en-US` |
| `system_prompt` | string | Instructions for AI | **Required** |
| `first_message` | string | Initial greeting | `null` |
| `farewell_message` | string | Goodbye message | `null` |
| `sample_rate` | number | `8000` (tel), `16000` (hd) | **Required** |
| `max_duration` | number | Max seconds (120-3600) | `300` |
| `tools` | array | Client tools (Middleware only) | `[]` |

---

## 🌐 Production Checklist

- [ ] AudioSocket module loaded and persistent
- [ ] API key stored securely in `[globals]`
- [ ] Sample rate set to 8000 Hz
- [ ] Max duration configured
- [ ] If using Middleware: process manager (PM2, systemd)
- [ ] If using Middleware: AMI credentials configured
- [ ] Tested with real calls
- [ ] Monitoring enabled

---

## 💡 Which Architecture Should I Use?

| Feature | Direct Mode | Middleware Mode |
|---------|-------------|-----------------|
| Simple conversations | ✅ Yes | ✅ Yes |
| Transfer calls | ❌ No | ✅ Yes |
| Hangup via AMI | ❌ No | ✅ Yes |
| Dial external numbers | ❌ No | ✅ Yes |
| Complexity | Low | Medium |
| Setup | 2 minutes | 10 minutes |

**Recommendation**: Start with **Direct Mode**. Upgrade to **Middleware** when you need client tools.

---

## 📚 Additional Resources

- [Client Tools Guide](TOOLS.md)
- [AillomVox Protocol](PROTOCOL.md)
- [Provider Comparison](PROVIDERS.md)

Happy building! 🎉
