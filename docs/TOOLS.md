# Client Tools Guide

Client tools let the model ask your application to run local actions during a live call. Use them for UI actions, browser state, mobile app behavior, or bridge logic such as Asterisk transfer/hangup.

Server-side tools are managed by the gateway. Client tools are defined in your WebSocket config and must return a `tool_result` quickly.

## Quick start

```typescript
import { AillomVox } from 'aillom-vox-client';

const client = new AillomVox({
  apiKey: process.env.AILLOMVOX_KEY!,
  provider: 'aillomvox',
  ttsEngine: 'inworld',
  voice: 'Aanya',
  sampleRate: 16000,
  systemPrompt: 'You are a concise assistant.',
  tools: [
    {
      name: 'hangup',
      description: 'End the current call when the user says goodbye.',
      parameters: { type: 'object', properties: {} },
    },
  ],
});

client.on('tool_call', (tool) => {
  if (tool.name === 'hangup') {
    client.sendHangup();
    client.sendToolResult(tool.call_id, 'Call ended');
  }
});

await client.connect();
```

## Tool definition format

```javascript
{
  name: 'tool_name',
  description: 'Specific description of when the model should call it',
  parameters: {
    type: 'object',
    properties: {
      message: { type: 'string', description: 'Message to show' },
    },
    required: ['message'],
  },
}
```

## Common tools

### Show alert

```typescript
const client = new AillomVox({
  apiKey,
  provider: 'aillomvox',
  ttsEngine: 'inworld',
  voice: 'Aanya',
  sampleRate: 16000,
  systemPrompt: 'You can show important messages to the user.',
  tools: [
    {
      name: 'show_alert',
      description: 'Display an important message to the user.',
      parameters: {
        type: 'object',
        properties: {
          message: { type: 'string', description: 'Alert message' },
          severity: { type: 'string', enum: ['info', 'warning', 'error'] },
        },
        required: ['message'],
      },
    },
  ],
});

client.on('tool_call', (tool) => {
  if (tool.name === 'show_alert') {
    alert(`[${tool.args.severity || 'info'}] ${tool.args.message}`);
    client.sendToolResult(tool.call_id, 'Alert displayed');
  }
});
```

### Navigate

```typescript
client.on('tool_call', (tool) => {
  if (tool.name === 'navigate_to_page') {
    window.location.href = String(tool.args.url);
    client.sendToolResult(tool.call_id, 'Navigating');
  }
});
```

## Provider notes

- AillomVox, OpenAI, Gemini and AWS are the best starting points for strict tool workflows.
- Qwen realtime behavior can be answer-only in some flows; design fallback behavior if tools are mandatory.
- Always send a tool result within roughly 15 seconds or the model can stall.

## Debugging

```typescript
client.on('tool_call', (tool) => {
  console.log('TOOL CALL', tool.name, tool.call_id, tool.args);
});

client.on('raw', (event) => {
  console.debug('RAW EVENT', event);
});
```
