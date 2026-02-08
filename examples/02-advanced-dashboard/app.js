// Advanced Dashboard Client Logic - Universal for All Providers
const connectBtn = document.getElementById('connectBtn');
const disconnectBtn = document.getElementById('disconnectBtn');
const logsContainer = document.getElementById('logsContainer');
const transcriptContainer = document.getElementById('transcriptContainer');
const statusBadge = document.getElementById('connectionStatus');
const micLabel = document.getElementById('micLabel');
const callTimer = document.getElementById('callTimer');

// Inputs
const inputs = {
    apikey: document.getElementById('apikey'),
    provider: document.getElementById('provider'),
    voice: document.getElementById('voice'),
    language: document.getElementById('language'),
    system_prompt: document.getElementById('system_prompt'),
    sample_rate: document.getElementById('sample_rate'),
    first_message: document.getElementById('first_message'),
    tools: document.getElementById('toolsConfig')
};

let socket;
let audioContext;
let processor;
let mediaStream;
let callStartTime;
let timerInterval;

// 🎯 ULTRAVOX PATTERN: Track scheduled audio sources for instant barge-in clearing
let scheduledSources = [];

// --- Visualizer Setup ---
const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');
let analyser;

function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
}

window.addEventListener('resize', resizeCanvas);

function setupVisualizer(stream) {
    if (!audioContext) return;
    resizeCanvas();
    const source = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    drawVisualizer();
}

function drawVisualizer() {
    if (!analyser) return;
    requestAnimationFrame(drawVisualizer);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0d1117');
    gradient.addColorStop(1, '#000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width / bufferLength) * 2;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.8;

        // Gradient bars
        const barGradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        barGradient.addColorStop(0, '#667eea');
        barGradient.addColorStop(1, '#764ba2');

        ctx.fillStyle = barGradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
    }
}

// --- Provider Presets (Universal) ---
const presets = {
    aillomvox: {
        voice: "Heitor",
        language: "pt-BR",
        sample_rate: "16000",
        system_prompt: "Você é um assistente da Aillom. Seja conciso."
    },
    aws: {
        voice: "matthew",
        language: "pt-BR",
        sample_rate: "16000",
        system_prompt: "You are a helpful assistant. Respond in Portuguese Brazilian."
    },
    openai: {
        voice: "alloy",
        language: "pt-BR",
        sample_rate: "24000",
        system_prompt: "Act as a helpful assistant. Respond in Portuguese Brazilian."
    },
    gemini: {
        voice: "Kore",
        language: "pt-BR",
        sample_rate: "16000",
        system_prompt: "You are a helpful assistant. Respond in Portuguese Brazilian."
    },
    ultravox: {
        voice: "Mark",
        language: "en-US",
        sample_rate: "16000",
        system_prompt: "You are a helpful assistant."
    },
    qwen: {
        voice: "Cherry",
        language: "zh-CN",
        sample_rate: "16000",
        system_prompt: "You are a helpful assistant."
    },
    grok: {
        voice: "Ara",
        language: "en-US",
        sample_rate: "16000",
        system_prompt: "You are a helpful assistant."
    }
};

inputs.provider.addEventListener('change', () => {
    const preset = presets[inputs.provider.value];
    if (preset) {
        inputs.voice.value = preset.voice;
        inputs.language.value = preset.language;
        inputs.sample_rate.value = preset.sample_rate;
        inputs.system_prompt.value = preset.system_prompt;
    }
});

// --- Call Timer ---
function startTimer() {
    callStartTime = Date.now();
    callTimer.classList.remove('hidden');
    timerInterval = setInterval(updateTimer, 1000);
}

function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
    callTimer.classList.add('hidden');
    callTimer.textContent = '00:00';
}

function updateTimer() {
    const elapsed = Math.floor((Date.now() - callStartTime) / 1000);
    const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const secs = (elapsed % 60).toString().padStart(2, '0');
    callTimer.textContent = `${mins}:${secs}`;
}

// --- Connect ---
connectBtn.onclick = async () => {
    const apiKey = inputs.apikey.value.trim();
    if (!apiKey) return log('API Key required!', 'error');

    updateStatus('CONNECTING', 'connecting');

    try {
        const sampleRate = parseInt(inputs.sample_rate.value, 10);
        audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate });

        // Universal WebSocket URL
        const wsUrl = window.location.hostname === 'localhost'
            ? 'ws://localhost:8080/ws'
            : 'wss://wss.aillom.com/ws';

        socket = new WebSocket(wsUrl);
        socket.binaryType = 'arraybuffer';

        socket.onopen = async () => {
            log('WebSocket Open. Sending Handshake...', 'info');
            updateStatus('CONNECTED', 'connected');

            // Parse tools - Universal format that works with all providers
            let tools = [];
            try {
                tools = JSON.parse(inputs.tools.value);
                // Normalize tool format for universal compatibility
                tools = tools.map(tool => ({
                    name: tool.name,
                    description: tool.description,
                    type: tool.type || 'function',
                    active: tool.active !== false,
                    // Support both 'config' and 'parameters' keys for backwards compatibility
                    config: tool.config || tool.parameters || { type: 'object', properties: {} }
                }));
            } catch (e) {
                log('Error parsing Tools JSON: ' + e.message, 'error');
            }

            // Universal Handshake - works with all providers
            const handshake = {
                type: 'config',
                apikey: apiKey,
                provider: inputs.provider.value,
                voice: inputs.voice.value,
                language: inputs.language.value,
                sample_rate: sampleRate,
                system_prompt: inputs.system_prompt.value,
                first_message: inputs.first_message.value,
                tools: tools
            };

            socket.send(JSON.stringify(handshake));
            await startAudio();
            startTimer();
            toggleUI(true);
        };

        socket.onmessage = (event) => {
            if (typeof event.data === 'string') {
                const msg = JSON.parse(event.data);

                // Handle different message types
                if (msg.type === 'transcript') {
                    // Only show FINAL transcripts to avoid spam
                    if (msg.final === true) {
                        addTranscript(msg.role, msg.text);
                    }
                    // Log all transcripts for debugging
                    if (msg.final) {
                        log(`[${msg.role}] ${msg.text}`, 'info');
                    }
                } else if (msg.type === 'tool_call') {
                    handleToolCall(msg);
                } else if (msg.type === 'playback_clear_buffer') {
                    // 🎯 ULTRAVOX PATTERN: Instant barge-in — clear all buffered audio
                    clearPlaybackBuffer();
                    log('🔇 Barge-in: audio buffer cleared', 'info');
                } else if (msg.type === 'state') {
                    // 🎯 ULTRAVOX P1: Conversation state machine
                    const stateLabels = { listening: 'LISTENING', thinking: 'THINKING', speaking: 'SPEAKING' };
                    updateStatus(stateLabels[msg.state] || msg.state.toUpperCase(), 'connected');
                    log(`🔄 State: ${msg.state}`, 'normal');
                } else if (msg.type === 'hangup' || msg.type === 'close') {
                    log('Call ended by server', 'normal');
                    disconnect();
                } else if (msg.type === 'error') {
                    log(`Error: ${msg.message || msg.error}`, 'error');
                } else if (msg.type !== 'audio') {
                    log(`RX: ${JSON.stringify(msg)}`, 'normal');
                }
            } else {
                // Binary audio data
                playAudioChunk(event.data);
            }
        };

        socket.onclose = (e) => {
            log(`Socket Closed: ${e.code}`, 'normal');
            disconnect();
        };

        socket.onerror = (e) => log('Socket Error', 'error');

    } catch (e) {
        log(e.message, 'error');
        disconnect();
    }
};

disconnectBtn.onclick = disconnect;

function disconnect() {
    clearPlaybackBuffer();
    log('Disconnecting...', 'normal');
    stopTimer();

    if (socket) {
        socket.onclose = null;
        socket.close();
    }
    if (mediaStream) {
        mediaStream.getTracks().forEach(t => t.stop());
        mediaStream = null;
    }
    if (processor) {
        processor.disconnect();
        processor = null;
    }
    if (audioContext && audioContext.state !== 'closed') audioContext.close();

    updateStatus('DISCONNECTED', 'disconnected');
    toggleUI(false);
    micLabel.innerHTML = '<i class="fa-solid fa-microphone-slash"></i> MIC OFF';
    micLabel.classList.remove('active');
}

async function startAudio() {
    mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: audioContext.sampleRate
        }
    });

    micLabel.innerHTML = '<i class="fa-solid fa-microphone"></i> MIC ON';
    micLabel.classList.add('active');

    setupVisualizer(mediaStream);

    const source = audioContext.createMediaStreamSource(mediaStream);
    processor = audioContext.createScriptProcessor(4096, 1, 1);

    processor.onaudioprocess = (e) => {
        if (socket.readyState !== WebSocket.OPEN) return;
        const inputData = e.inputBuffer.getChannelData(0);
        socket.send(floatTo16BitPCM(inputData));
    };

    source.connect(processor);
    processor.connect(audioContext.destination);
}

// Audio playback queue
let nextStartTime = 0;

/**
 * 🎯 ULTRAVOX PATTERN: Clear all buffered/scheduled audio instantly
 * Called when server detects barge-in (user speaking while AI is talking)
 */
function clearPlaybackBuffer() {
    for (const source of scheduledSources) {
        try { source.stop(); } catch (e) { /* already stopped */ }
    }
    scheduledSources = [];
    nextStartTime = 0;
}

/**
 * 🎯 ULTRAVOX PATTERN: Sequential audio scheduling with tracking
 * Schedules chunks sequentially and tracks sources for cancellation
 */
function playAudioChunk(arrayBuffer) {
    if (!audioContext || audioContext.state === 'closed') return;
    const float32 = new Float32Array(arrayBuffer.byteLength / 2);
    const view = new DataView(arrayBuffer);
    for (let i = 0; i < float32.length; i++) {
        const s = view.getInt16(i * 2, true);
        float32[i] = s < 0 ? s / 0x8000 : s / 0x7FFF;
    }

    const buffer = audioContext.createBuffer(1, float32.length, parseInt(inputs.sample_rate.value));
    buffer.getChannelData(0).set(float32);

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);

    const now = audioContext.currentTime;
    if (nextStartTime < now) nextStartTime = now;
    source.start(nextStartTime);
    nextStartTime += buffer.duration;

    // Track for cancellation on barge-in
    scheduledSources.push(source);
    source.onended = () => {
        scheduledSources = scheduledSources.filter(s => s !== source);
    };
}

// --- Tool Handling (Universal) ---
function handleToolCall(msg) {
    // Debug: log the full tool call message
    log(`🛠️ Tool Call: ${msg.name} | Full msg: ${JSON.stringify(msg)}`, 'success');

    let result = 'Tool executed successfully.';

    // Get args - handle different formats from different providers
    const args = msg.args || msg.arguments || msg.parameters || {};

    // Handle known client-side tools
    if (msg.name === 'show_alert') {
        const message = args.message || 'Alert from AI';
        alert(`AI Says: ${message}`);
        result = 'Alert displayed to user.';
    } else if (msg.name === 'change_bg_color') {
        // Accept both 'color' and 'bg_color' since LLMs may use either
        const color = args.color || args.bg_color;
        log(`Received color from args: "${color}"`, 'info');
        if (color) {
            document.body.style.backgroundColor = color === 'black' ? '#0a0c10' : color;
            result = `Background changed to ${color}`;
            log(`Background color changed to: ${color}`, 'success');
        } else {
            result = 'Error: No color specified';
            log('Error: No color in args', 'error');
        }
    } else if (msg.name === 'hangup') {
        result = 'Call ending...';
        setTimeout(disconnect, 500);
    } else {
        // Unknown tool - log it
        log(`Unknown tool: ${msg.name} - Args: ${JSON.stringify(args)}`, 'normal');
        result = `Tool ${msg.name} acknowledged.`;
    }

    // Send result back to server (works with all providers)
    socket.send(JSON.stringify({
        type: 'tool_result',
        call_id: msg.call_id,
        result: result
    }));
}

// --- Transcript ---
function addTranscript(role, text) {
    const div = document.createElement('div');
    div.className = `transcript-msg ${role}`;
    div.textContent = text;
    transcriptContainer.appendChild(div);
    transcriptContainer.scrollTop = transcriptContainer.scrollHeight;
}

// --- Utilities ---
function floatTo16BitPCM(input) {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
        const s = Math.max(-1, Math.min(1, input[i]));
        output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return output.buffer;
}

function updateStatus(text, className) {
    const icon = className === 'connected' ? 'fa-circle' :
        className === 'connecting' ? 'fa-spinner fa-spin' : 'fa-circle';
    statusBadge.innerHTML = `<i class="fa-solid ${icon}"></i> ${text}`;
    statusBadge.className = `status-badge ${className}`;
}

function toggleUI(connected) {
    connectBtn.classList.toggle('hidden', connected);
    disconnectBtn.classList.toggle('hidden', !connected);
    Object.values(inputs).forEach(i => i.disabled = connected);
}

function log(msg, type = 'normal') {
    const div = document.createElement('div');
    div.className = `log-entry ${type}`;
    const time = new Date().toLocaleTimeString();
    div.textContent = `[${time}] ${msg}`;
    logsContainer.appendChild(div);
    logsContainer.scrollTop = logsContainer.scrollHeight;
}

// --- Clear Buttons ---
document.getElementById('clearLogsBtn').onclick = () => logsContainer.innerHTML = '';
document.getElementById('clearTranscriptBtn').onclick = () => transcriptContainer.innerHTML = '';

// Initial canvas resize
setTimeout(resizeCanvas, 100);
