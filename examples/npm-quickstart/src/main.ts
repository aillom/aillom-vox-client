import { AillomVox } from 'aillom-vox-client';
import './styles.css';

type ProviderResponse = {
  providers?: Array<{
    id: string;
    name?: string;
    tts_options?: Array<{ id: string; name?: string }>;
  }>;
};

type VoicesResponse = {
  voices?: Array<{
    id?: string;
    voice_id?: string;
    voiceId?: string;
    name?: string;
    displayName?: string;
    title?: string;
    label?: string;
  }>;
};

type TranscriptMessage = {
  role?: string;
  text?: string;
  final?: boolean;
};

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const form = $('sessionForm') as HTMLFormElement;
const apiKeyInput = $('apiKey') as HTMLInputElement;
const providerSelect = $('provider') as HTMLSelectElement;
const ttsField = $('ttsField') as HTMLLabelElement;
const ttsEngineSelect = $('ttsEngine') as HTMLSelectElement;
const voiceSelect = $('voice') as HTMLSelectElement;
const languageSelect = $('language') as HTMLSelectElement;
const sampleRateSelect = $('sampleRate') as HTMLSelectElement;
const promptInput = $('systemPrompt') as HTMLTextAreaElement;
const catalogButton = $('catalogButton') as HTMLButtonElement;
const startButton = $('startButton') as HTMLButtonElement;
const stopButton = $('stopButton') as HTMLButtonElement;
const sendTextButton = $('sendTextButton') as HTMLButtonElement;
const textInput = $('textInput') as HTMLInputElement;
const statusPill = $('statusPill');
const stateText = $('stateText');
const audioText = $('audioText');
const chunkCount = $('chunkCount');
const transcript = $('transcript');
const eventLog = $('eventLog');

let client: AillomVox | null = null;
let audioContext: AudioContext | null = null;
let mediaStream: MediaStream | null = null;
let processor: ScriptProcessorNode | null = null;
let scheduledSources: AudioBufferSourceNode[] = [];
let nextPlayTime = 0;
let chunks = 0;

apiKeyInput.value = sessionStorage.getItem('aillomvox_api_key') || '';

providerSelect.addEventListener('change', () => {
  ttsField.hidden = providerSelect.value !== 'aillomvox';
  setDefaultVoice();
});

catalogButton.addEventListener('click', () => {
  loadVoices().catch((error) => setError(error));
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  startSession().catch((error) => setError(error));
});

stopButton.addEventListener('click', () => stopSession('manual'));

sendTextButton.addEventListener('click', () => {
  const text = textInput.value.trim();
  if (!text || !client?.connected) return;
  client.sendText(text);
  appendTranscript('user', text);
  textInput.value = '';
});

textInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') sendTextButton.click();
});

async function loadVoices() {
  setStatus('catalogo', 'Carregando vozes');
  const providerKey = providerSelect.value === 'aillomvox' ? ttsEngineSelect.value : providerSelect.value;
  const data = (await AillomVox.fetchVoices({
    provider: providerKey,
    pageSize: 80,
    preferredLanguage: languageSelect.value,
  })) as VoicesResponse;

  const voices = (data.voices || [])
    .map((voice) => ({
      id: voice.id || voice.voice_id || voice.voiceId || '',
      label: voice.name || voice.displayName || voice.title || voice.label || voice.id || voice.voice_id || voice.voiceId || '',
    }))
    .filter((voice) => voice.id);

  voiceSelect.innerHTML = '';
  for (const voice of voices) {
    const option = document.createElement('option');
    option.value = voice.id;
    option.textContent = voice.label && voice.label !== voice.id ? `${voice.label} (${voice.id})` : voice.id;
    voiceSelect.appendChild(option);
  }

  if (voices.length === 0) setDefaultVoice();
  appendLog(`${voices.length} vozes carregadas para ${providerKey}`);
  setStatus('pronto', 'Vozes carregadas');
}

async function startSession() {
  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) {
    apiKeyInput.focus();
    throw new Error('Informe uma API key.');
  }

  sessionStorage.setItem('aillomvox_api_key', apiKey);
  clearTranscript();
  chunks = 0;
  chunkCount.textContent = '0';
  setStatus('conectando', 'Abrindo sessão');

  audioContext = new AudioContext({ sampleRate: Number(sampleRateSelect.value) });
  client = new AillomVox({
    apiKey,
    authMode: 'handshake',
    provider: providerSelect.value,
    ttsEngine: providerSelect.value === 'aillomvox' ? ttsEngineSelect.value : undefined,
    voice: voiceSelect.value,
    language: languageSelect.value,
    sampleRate: Number(sampleRateSelect.value) as 8000 | 16000 | 24000,
    systemPrompt: promptInput.value,
    firstMessage: 'Ola! Pode falar comigo.',
  });

  wireClient(client);
  await client.connect();
  await startMicrophone();
  setConnected(true);
  setStatus('online', 'Fale agora');
}

function wireClient(vox: AillomVox) {
  vox.on('connected', () => appendLog(`WebSocket conectado: ${vox.websocketUrl}`));
  vox.on('disconnected', (event) => {
    appendLog(`Sessão encerrada ${event.reason || event.code || ''}`.trim());
    stopSession('remote');
  });
  vox.on('control', (event) => appendLog(`controle: ${event.action || 'evento'}`));
  vox.on('state', (event) => {
    stateText.textContent = event.state;
    setStatus(event.state, event.state);
  });
  vox.on('transcript', (message) => {
    const t = message as TranscriptMessage;
    if (t.final !== false && t.text) appendTranscript(t.role || 'assistant', t.text);
  });
  vox.on('playback_clear_buffer', () => {
    clearPlaybackBuffer();
    appendLog('playback limpo por interrupção');
  });
  vox.on('audio', (pcm) => {
    chunks += 1;
    chunkCount.textContent = String(chunks);
    audioText.textContent = 'recebendo';
    playPcmChunk(pcm);
  });
  vox.on('error', (error) => setError(error));
}

async function startMicrophone() {
  if (!audioContext || !client) return;
  mediaStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  });

  const source = audioContext.createMediaStreamSource(mediaStream);
  processor = audioContext.createScriptProcessor(2048, 1, 1);
  processor.onaudioprocess = (event) => {
    if (!client?.connected) return;
    client.sendAudio(floatToPcm16(event.inputBuffer.getChannelData(0)));
  };

  source.connect(processor);
  processor.connect(audioContext.destination);
  audioText.textContent = 'microfone';
}

function playPcmChunk(chunk: ArrayBuffer | ArrayBufferView) {
  if (!audioContext) return;
  const arrayBuffer = ArrayBuffer.isView(chunk)
    ? chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.byteLength)
    : chunk;
  const view = new DataView(arrayBuffer);
  const output = new Float32Array(arrayBuffer.byteLength / 2);

  for (let i = 0; i < output.length; i += 1) {
    const sample = view.getInt16(i * 2, true);
    output[i] = sample < 0 ? sample / 0x8000 : sample / 0x7fff;
  }

  const buffer = audioContext.createBuffer(1, output.length, Number(sampleRateSelect.value));
  buffer.copyToChannel(output, 0);

  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(audioContext.destination);

  const startAt = Math.max(audioContext.currentTime, nextPlayTime);
  source.start(startAt);
  nextPlayTime = startAt + buffer.duration;
  scheduledSources.push(source);
  source.onended = () => {
    scheduledSources = scheduledSources.filter((item) => item !== source);
    if (scheduledSources.length === 0) audioText.textContent = client?.connected ? 'microfone' : 'parado';
  };
}

function floatToPcm16(input: Float32Array) {
  const pcm = new Int16Array(input.length);
  for (let i = 0; i < input.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, input[i]));
    pcm[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }
  return pcm;
}

function stopSession(reason: 'manual' | 'remote') {
  clearPlaybackBuffer();
  if (reason === 'manual') client?.sendHangup();
  client?.disconnect();
  client = null;

  if (processor) {
    processor.disconnect();
    processor = null;
  }
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  }
  if (audioContext && audioContext.state !== 'closed') {
    audioContext.close().catch(() => undefined);
  }
  audioContext = null;
  audioText.textContent = 'parado';
  stateText.textContent = 'pronto';
  setConnected(false);
  if (reason === 'manual') setStatus('offline', 'Encerrado');
}

function clearPlaybackBuffer() {
  for (const source of scheduledSources) {
    try {
      source.stop();
    } catch {
      // already stopped
    }
  }
  scheduledSources = [];
  nextPlayTime = 0;
}

function setConnected(connected: boolean) {
  startButton.disabled = connected;
  stopButton.disabled = !connected;
  sendTextButton.disabled = !connected;
  catalogButton.disabled = connected;
  providerSelect.disabled = connected;
  ttsEngineSelect.disabled = connected;
  voiceSelect.disabled = connected;
  sampleRateSelect.disabled = connected;
}

function setStatus(kind: string, text: string) {
  statusPill.textContent = text;
  statusPill.dataset.state = kind;
  stateText.textContent = text;
}

function setError(error: unknown) {
  const message = error instanceof Error ? error.message : JSON.stringify(error);
  appendLog(`erro: ${message}`);
  setStatus('erro', 'Erro');
}

function appendTranscript(role: string, text: string) {
  transcript.querySelector('.empty')?.remove();
  const row = document.createElement('p');
  row.className = `line ${role === 'user' ? 'user' : 'assistant'}`;
  row.innerHTML = `<span>${role === 'user' ? 'Você' : 'Vox'}</span>${escapeHtml(text)}`;
  transcript.appendChild(row);
  transcript.scrollTop = transcript.scrollHeight;
}

function clearTranscript() {
  transcript.innerHTML = '<p class="empty">Transcrições aparecem aqui.</p>';
  eventLog.innerHTML = '';
}

function appendLog(message: string) {
  const row = document.createElement('div');
  row.textContent = `${new Date().toLocaleTimeString()} - ${message}`;
  eventLog.prepend(row);
}

function setDefaultVoice() {
  const fallback = providerSelect.value === 'aillomvox' ? 'Aanya' : '';
  voiceSelect.innerHTML = '';
  const option = document.createElement('option');
  option.value = fallback;
  option.textContent = fallback || 'Carregue o catalogo';
  voiceSelect.appendChild(option);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return map[char];
  });
}

async function warmCatalog() {
  try {
    const catalog = (await AillomVox.fetchProviders({ includeVoices: false })) as ProviderResponse;
    appendLog(`${catalog.providers?.length || 0} providers disponiveis`);
  } catch (error) {
    appendLog(`catalogo indisponivel: ${error instanceof Error ? error.message : 'erro'}`);
  }
}

setDefaultVoice();
warmCatalog();
