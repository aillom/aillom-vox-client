# AillomVox npm quickstart

This example installs the published `aillom-vox-client` package from npm and runs a browser voice test UI with Vite.

```bash
cd examples/npm-quickstart
npm install
npm run dev
```

Open the Vite URL, paste an `av_...` API key, load voices, and start the call.

The example covers:

- `npm install aillom-vox-client`
- `AillomVox.fetchProviders()`
- `AillomVox.fetchVoices()`
- `new AillomVox(...)`
- microphone PCM16 streaming
- sequential playback
- `playback_clear_buffer`
- transcripts
- `sendText()`
- `sendHangup()`
