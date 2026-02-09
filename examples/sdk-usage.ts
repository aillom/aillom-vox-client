import { AillomVox } from '../src'; // In production: from 'aillom-vox-client'

// 1. Initialize Client
const client = new AillomVox({
    apiKey: 'av_YOUR_API_KEY_HERE',
    debug: true,
    voice: 'Edward',
    systemPrompt: 'You are a helpful assistant.'
});

// 2. Setup Event Listeners
client.on('connected', () => {
    console.log('✅ Connected to AillomVox!');
});

client.on('transcript', (msg) => {
    if (msg.role === 'assistant') {
        console.log(`🤖 AI: ${msg.text}`);
    } else {
        console.log(`👤 User: ${msg.text}`);
    }
});

client.on('audio', (buffer) => {
    // Received PCM 16-bit audio chunk
    // Play with speaker or save to file
    console.log(`🔊 Received ${buffer.byteLength} bytes of audio`);
});

client.on('disconnected', (reason) => {
    console.log('❌ Disconnected:', reason);
});

// 3. Connect
async function start() {
    try {
        await client.connect();
        console.log('Listening...');
    } catch (err) {
        console.error('Connection failed:', err);
    }
}

start();
