// Basic AillomVox Client
const connectBtn = document.getElementById('connectBtn');
const disconnectBtn = document.getElementById('disconnectBtn');
const statusDiv = document.getElementById('status');
const apiKeyInput = document.getElementById('apiKey');

let socket;
let audioContext;
let processor;
let mediaStream;

// 🎯 ULTRAVOX PATTERN: Track scheduled audio sources for instant barge-in clearing
let scheduledSources = [];
let nextPlayTime = 0;

connectBtn.onclick = async () => {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) return alert('Please enter an API Key');

    // 1. Initialize Audio Context (Must be user-initiated)
    audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });

    // 2. Connect to WebSocket
    // Note: Replace 'your-server-url' with actual server if hosted elsewhere
    // For local dev with aillom-vox, use localhost:8080
    // For production, use wss://wss.aillom.com/ws
    const wsUrl = window.location.hostname === 'localhost'
        ? 'ws://localhost:8080/ws'
        : 'wss://wss.aillom.com/ws';

    socket = new WebSocket(wsUrl);
    socket.binaryType = 'arraybuffer';

    socket.onopen = async () => {
        statusDiv.textContent = 'Connected. Handshaking...';

        // 3. Send Configuration Handshake
        const handshake = {
            type: 'config',
            apikey: apiKey,
            provider: 'aillomvox',
            voice: 'Edward',
            language: 'en-US',
            sample_rate: 16000,
            system_prompt: 'You are a helpful assistant. Be concise and friendly.',
            tools: []
        };
        socket.send(JSON.stringify(handshake));

        // 4. Start Microphone and Audio Processing
        await startMicrophone();

        statusDiv.textContent = '🟢 Online - Speak now!';
        toggleButtons(true);
    };

    socket.onmessage = (event) => {
        if (typeof event.data === 'string') {
            const msg = JSON.parse(event.data);
            console.log('Server Message:', msg);

            switch (msg.type) {
                case 'hangup':
                    disconnect();
                    break;

                case 'playback_clear_buffer':
                    // 🎯 ULTRAVOX PATTERN: Instant barge-in — clear all buffered audio
                    clearPlaybackBuffer();
                    break;

                case 'transcript':
                    if (msg.final) {
                        console.log(`[${msg.role}] ${msg.text}`);
                    }
                    break;

                case 'error':
                    console.error('Server error:', msg.message);
                    break;

                case 'state':
                    // 🎯 ULTRAVOX P1: Conversation state machine
                    statusDiv.textContent = msg.state === 'listening' ? '🟢 Listening...'
                        : msg.state === 'thinking' ? '🟡 Thinking...'
                            : msg.state === 'speaking' ? '🟠 Speaking...'
                                : `🟢 ${msg.state}`;
                    break;
            }
        } else {
            // Audio Data (PCM 16-bit) received from server -> Play it
            playAudioChunk(event.data);
        }
    };

    socket.onclose = () => {
        statusDiv.textContent = '🔴 Disconnected';
        disconnect();
    };
};

disconnectBtn.onclick = disconnect;

function disconnect() {
    clearPlaybackBuffer();
    if (socket) socket.close();
    if (audioContext) audioContext.close();
    if (mediaStream) mediaStream.getTracks().forEach(t => t.stop());
    toggleButtons(false);
}

function toggleButtons(connected) {
    connectBtn.disabled = connected;
    disconnectBtn.disabled = !connected;
    apiKeyInput.disabled = connected;
}

async function startMicrophone() {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = audioContext.createMediaStreamSource(mediaStream);

    // Simple Processor (Buffer Size 4096)
    processor = audioContext.createScriptProcessor(4096, 1, 1);

    processor.onaudioprocess = (e) => {
        if (socket.readyState !== WebSocket.OPEN) return;

        const inputData = e.inputBuffer.getChannelData(0);
        // Convert Float32 to Int16 for Server
        const pcmData = floatTo16BitPCM(inputData);
        socket.send(pcmData);
    };

    source.connect(processor);
    processor.connect(audioContext.destination);
}

/**
 * 🎯 ULTRAVOX PATTERN: Clear all buffered/scheduled audio instantly
 * Called when server detects barge-in (user speaking while AI is talking)
 * Stops all AudioBufferSourceNodes that haven't finished playing yet
 */
function clearPlaybackBuffer() {
    for (const source of scheduledSources) {
        try { source.stop(); } catch (e) { /* already stopped */ }
    }
    scheduledSources = [];
    nextPlayTime = 0;
    console.log('[AillomVox] 🔇 Playback buffer cleared (barge-in)');
}

/**
 * 🎯 ULTRAVOX PATTERN: Sequential audio scheduling
 * Instead of calling source.start() immediately (which causes overlap),
 * schedule each chunk to play after the previous one finishes.
 * This allows proper cancellation via clearPlaybackBuffer().
 */
function playAudioChunk(arrayBuffer) {
    if (!audioContext || audioContext.state === 'closed') return;

    const float32Data = new Float32Array(arrayBuffer.byteLength / 2);
    const dataView = new DataView(arrayBuffer);

    for (let i = 0; i < float32Data.length; i++) {
        const int16 = dataView.getInt16(i * 2, true); // Little Endian
        float32Data[i] = int16 < 0 ? int16 / 0x8000 : int16 / 0x7FFF;
    }

    const buffer = audioContext.createBuffer(1, float32Data.length, 16000);
    buffer.getChannelData(0).set(float32Data);

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);

    // Schedule sequentially: each chunk plays after the previous one ends
    const now = audioContext.currentTime;
    const startTime = Math.max(now, nextPlayTime);
    source.start(startTime);
    nextPlayTime = startTime + buffer.duration;

    // Track for cancellation on barge-in
    scheduledSources.push(source);
    source.onended = () => {
        scheduledSources = scheduledSources.filter(s => s !== source);
    };
}

function floatTo16BitPCM(input) {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
        const s = Math.max(-1, Math.min(1, input[i]));
        output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return output.buffer;
}
