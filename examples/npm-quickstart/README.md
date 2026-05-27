# AillomVox npm quickstart

This is a ready-made demo app from the SDK repository.

You do **not** need to clone this repository to use the SDK in your own app. For normal SDK usage, run this inside your project:

```bash
npm install aillom-vox-client
```

Clone this repository only when you want to run this example UI locally.

## What this example tests

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

## Requirements

- AillomVox API key from https://vox.aillom.com (`av_...`).
- Node.js 18 or newer.
- npm.
- Git.
- Browser microphone permission.

## Windows 10/11

Open **PowerShell**.

```powershell
winget install --id OpenJS.NodeJS.LTS -e
winget install --id Git.Git -e
```

Close PowerShell, open it again, then check:

```powershell
node -v
npm -v
git --version
```

Run:

```powershell
git clone https://github.com/aillom/aillom-vox-client.git
cd aillom-vox-client\examples\npm-quickstart
npm install
npm run dev
```

Open the URL printed by Vite, usually `http://localhost:3334/`.

## Ubuntu / Debian

Open **Terminal**.

```bash
sudo apt update
sudo apt install -y git curl ca-certificates
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm install --lts
nvm use --lts
```

Check:

```bash
node -v
npm -v
git --version
```

Run:

```bash
git clone https://github.com/aillom/aillom-vox-client.git
cd aillom-vox-client/examples/npm-quickstart
npm install
npm run dev
```

Open the URL printed by Vite, usually `http://localhost:3334/`.

## macOS

Open **Terminal**.

```bash
brew install node git
```

If you do not use Homebrew, install Node.js LTS from https://nodejs.org and Git from https://git-scm.com.

Check:

```bash
node -v
npm -v
git --version
```

Run:

```bash
git clone https://github.com/aillom/aillom-vox-client.git
cd aillom-vox-client/examples/npm-quickstart
npm install
npm run dev
```

Open the URL printed by Vite, usually `http://localhost:3334/`.

## How to use the UI

1. Paste your `av_...` API key.
2. Wait for the dynamic provider, TTS engine, and voice lists to load.
3. Keep `Provider` as `AillomVox`.
4. Click **Refresh catalog** if you need to reload the live lists.
5. Choose a voice.
6. Click **Start call**.
7. Allow microphone access.
8. Speak to the assistant.
9. Send typed text from the input if you want to test `sendText()`.
10. Click **End call** when finished.

## Common fixes

| Symptom | Fix |
| :--- | :--- |
| `node` or `npm` is not recognized on Windows | Close and reopen PowerShell after installing Node.js. |
| Browser blocks microphone | Use the Vite `localhost` URL and allow mic permission. |
| Port is already in use | Run `npm run dev -- --port 3335`. |
| `npm install` fails on Ubuntu | Check `node -v`; if it is below 18, reinstall with nvm. |
| No voices load | Check internet access and API key/account status. |
