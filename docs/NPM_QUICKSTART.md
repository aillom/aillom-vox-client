# Test the npm package

This guide is for someone starting from a clean machine. It installs the published `aillom-vox-client` package and runs the browser test UI.

## What you need

- An AillomVox API key from https://vox.aillom.com (`av_...`).
- Node.js 18 or newer.
- npm, which is installed with Node.js.
- Git.
- A browser with microphone permission. Chrome, Edge and Firefox work on `localhost`.

## Windows 10/11

Open **PowerShell** as your normal user.

1. Install Node.js LTS and Git:

```powershell
winget install --id OpenJS.NodeJS.LTS -e
winget install --id Git.Git -e
```

2. Close PowerShell and open it again.

3. Check the tools:

```powershell
node -v
npm -v
git --version
```

4. Download and run the example:

```powershell
git clone https://github.com/aillom/aillom-vox-client.git
cd aillom-vox-client\examples\npm-quickstart
npm install
npm run dev
```

5. Open the local URL printed by Vite, usually:

```text
http://localhost:3334/
```

## Ubuntu / Debian

Open **Terminal**.

1. Install Git and basic tools:

```bash
sudo apt update
sudo apt install -y git curl ca-certificates
```

2. Install Node.js LTS with nvm:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm install --lts
nvm use --lts
```

3. Check the tools:

```bash
node -v
npm -v
git --version
```

4. Download and run the example:

```bash
git clone https://github.com/aillom/aillom-vox-client.git
cd aillom-vox-client/examples/npm-quickstart
npm install
npm run dev
```

5. Open the local URL printed by Vite, usually:

```text
http://localhost:3334/
```

## macOS

Open **Terminal**.

1. If you use Homebrew:

```bash
brew install node git
```

If you do not use Homebrew, install Node.js LTS from https://nodejs.org and Git from https://git-scm.com.

2. Check the tools:

```bash
node -v
npm -v
git --version
```

3. Download and run the example:

```bash
git clone https://github.com/aillom/aillom-vox-client.git
cd aillom-vox-client/examples/npm-quickstart
npm install
npm run dev
```

4. Open the local URL printed by Vite, usually:

```text
http://localhost:3334/
```

## How to use the page

1. Paste your `av_...` API key.
2. Keep `AillomVox` as the provider for the first test.
3. Click **Carregar vozes**.
4. Select a voice.
5. Click **Iniciar chamada**.
6. Allow microphone access in the browser.
7. Speak to the assistant.
8. Use the text box to send a typed message into the same session.
9. Click **Encerrar** to stop the call.

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

The terminal test validates the npm package and REST helpers. The browser quickstart validates microphone capture, realtime WebSocket auth, PCM audio, transcripts, playback, text messages and hangup.

## Common fixes

| Symptom | Fix |
| :--- | :--- |
| `node` or `npm` is not recognized on Windows | Close and reopen PowerShell after installing Node.js. |
| Browser blocks microphone | Open the Vite URL on `localhost` or HTTPS and allow mic permission. |
| Port is already in use | Run `npm run dev -- --port 3335` and open the new URL. |
| `npm install` fails on Ubuntu | Run `node -v`; if it is below 18, install Node.js with nvm as shown above. |
| No voices load | Check internet access and confirm the API key belongs to an active AillomVox account. |
| WebSocket connects then closes | Check account balance, API key and browser console logs. |
