# Use and test the npm package

There are two different workflows:

- **Use the SDK in your app:** install `aillom-vox-client`. Do not clone this repository.
- **Run the ready-made examples:** clone this repository because the example files live here.

## Use the SDK in your app

In an existing Node, Vite, React, Vue, Next.js or backend project:

```bash
npm install aillom-vox-client
```

Then import the SDK:

```typescript
import { AillomVox } from 'aillom-vox-client';

const client = new AillomVox({
  apiKey: 'av_YOUR_API_KEY',
  provider: 'aillomvox',
  ttsEngine: 'inworld',
  voice: 'Aanya',
  language: 'en-US',
  sampleRate: 16000,
  systemPrompt: 'You are a concise and helpful assistant.',
});

await client.connect();
```

## Create a new browser app from zero

This does not clone the SDK repo. It creates your own app and installs the npm package.

### Windows PowerShell

```powershell
winget install --id OpenJS.NodeJS.LTS -e
npm create vite@latest my-vox-app -- --template vanilla-ts
cd my-vox-app
npm install
npm install aillom-vox-client
npm run dev
```

### Ubuntu / Debian

```bash
sudo apt update
sudo apt install -y curl ca-certificates
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm install --lts
nvm use --lts
npm create vite@latest my-vox-app -- --template vanilla-ts
cd my-vox-app
npm install
npm install aillom-vox-client
npm run dev
```

### macOS

```bash
brew install node
npm create vite@latest my-vox-app -- --template vanilla-ts
cd my-vox-app
npm install
npm install aillom-vox-client
npm run dev
```

## Run the ready-made example UI

Clone the repository only if you want to run the example UI from this repo.

The example includes:

- API key input
- provider and voice selectors
- voice catalog loading
- microphone streaming
- audio playback
- transcripts
- typed text input
- hangup button
- event logs

### Windows 10/11

Open **PowerShell**.

```powershell
winget install --id OpenJS.NodeJS.LTS -e
winget install --id Git.Git -e
git clone https://github.com/aillom/aillom-vox-client.git
cd aillom-vox-client\examples\npm-quickstart
npm install
npm run dev
```

### Ubuntu / Debian

Open **Terminal**.

```bash
sudo apt update
sudo apt install -y git curl ca-certificates
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm install --lts
nvm use --lts
git clone https://github.com/aillom/aillom-vox-client.git
cd aillom-vox-client/examples/npm-quickstart
npm install
npm run dev
```

### macOS

Open **Terminal**.

```bash
brew install node git
git clone https://github.com/aillom/aillom-vox-client.git
cd aillom-vox-client/examples/npm-quickstart
npm install
npm run dev
```

Open the local URL printed by Vite, usually:

```text
http://localhost:3334/
```

## How to use the example page

1. Paste your `av_...` API key.
2. Wait for the dynamic provider, TTS engine, and voice lists to load.
3. Keep `AillomVox` as the provider for the first test.
4. Click **Refresh catalog** if you need to reload the live lists.
5. Select a voice.
6. Click **Start call**.
7. Allow microphone access in the browser.
8. Speak to the assistant.
9. Use the text box to send a typed message into the same session.
10. Click **End call** to stop the call.

## Terminal-only smoke test

Use this when you only want to check that npm install and the REST helpers work:

```bash
mkdir vox-smoke
cd vox-smoke
npm init -y
npm install aillom-vox-client
node -e "const { AillomVox } = require('aillom-vox-client'); Promise.all([AillomVox.fetchProviders({ includeVoices: false }), AillomVox.fetchPricing()]).then(([providers, pricing]) => console.log({ providers: providers.count, pricing: pricing.count }))"
```

Expected result:

```text
{ providers: 7, pricing: 7 }
```

## Common fixes

| Symptom | Fix |
| :--- | :--- |
| `node` or `npm` is not recognized on Windows | Close and reopen PowerShell after installing Node.js. |
| Browser blocks microphone | Open the Vite URL on `localhost` or HTTPS and allow mic permission. |
| Port is already in use | Run `npm run dev -- --port 3335` and open the new URL. |
| `npm install` fails on Ubuntu | Run `node -v`; if it is below 18, install Node.js with nvm as shown above. |
| No voices load | Check internet access and confirm the API key belongs to an active AillomVox account. |
| WebSocket connects then closes | Check account balance, API key and browser console logs. |
