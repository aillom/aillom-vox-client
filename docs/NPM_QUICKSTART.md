# Test the npm package

The quickest full browser test is the npm quickstart app:

```bash
git clone https://github.com/aillom/aillom-vox-client.git
cd aillom-vox-client/examples/npm-quickstart
npm install
npm run dev
```

Open the local Vite URL, paste an AillomVox API key (`av_...`), click **Carregar vozes**, then **Iniciar chamada**.

For a terminal-only smoke test:

```bash
mkdir vox-smoke && cd vox-smoke
npm init -y
npm install aillom-vox-client
node -e "const { AillomVox } = require('aillom-vox-client'); Promise.all([AillomVox.fetchProviders({ includeVoices: false }), AillomVox.fetchPricing()]).then(([providers, pricing]) => console.log({ providers: providers.count, pricing: pricing.count }))"
```

Expected result:

```text
{ providers: 7, pricing: 7 }
```

The terminal test validates REST helpers. The browser quickstart validates microphone capture, realtime WebSocket auth, PCM audio, transcripts, playback, text messages and hangup.
