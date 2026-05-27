/**
 * Run from repo root after `npm install` and `npm run build`:
 *   npx tsx examples/sdk-usage.ts
 *
 * Uses `../src` for local development. Published apps should import from `aillom-vox-client`.
 */
import { AillomVox, normalizeWebSocketUrl } from '../src';
import type { ToolCallEvent } from '../src';

async function demoCatalog() {
    const catalog = await AillomVox.fetchProviders({ includeVoices: false });
    console.log('Provider catalog keys:', Object.keys(catalog as object));
}

const client = new AillomVox({
    apiKey: 'av_YOUR_API_KEY_HERE',
    debug: true,
    provider: 'aillomvox',
    ttsEngine: 'inworld',
    voice: 'Aanya',
    language: 'en-US',
    systemPrompt: 'You are a helpful assistant.',
    firstMessage: 'Hello! How can I help you today?',
    gatewayUrl: normalizeWebSocketUrl('https://vox.aillom.com'),
});

client.on('connected', () => {
    console.log('Connected →', client.websocketUrl);
});

client.on('transcript', (msg) => {
    if (msg.role === 'assistant') {
        console.log(`AI: ${msg.text}`);
    } else {
        console.log(`User: ${msg.text}`);
    }
});

client.on('audio', (buffer) => {
    console.log(`PCM chunk: ${buffer.byteLength} bytes`);
});

client.on('playback_clear_buffer', () => {
    console.log('Barge-in: clear playback queue');
});

client.on('tool_call', (msg) => {
    const m = msg as ToolCallEvent;
    client.sendToolResult(m.call_id, 'ok');
});

client.on('disconnected', (reason) => {
    console.log('Disconnected:', reason);
});

async function start() {
    await demoCatalog().catch(console.error);
    try {
        await client.connect();
    } catch (err) {
        console.error('Connection failed:', err);
    }
}

start();
