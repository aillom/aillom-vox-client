# n8n-nodes-aillomvox

Official AillomVox (Voice & AI Gateway) integration for n8n.

This node allows you to natively interact with the AillomVox API within your n8n workflows, without needing to configure manual HTTP requests.

## Features

The AillomVox node supports the following operations:

### Resource: Info
*   **Get Voices**: Returns available voices, filterable by current providers/TTS engines such as AillomVox, Inworld, LMNT, Rime, Fish Audio, Soniox, xAI, Gemini, AWS, Qwen, OpenAI, Grok, and Ultravox.
*   **Get Providers**: Returns the supported realtime providers and nested AillomVox TTS options.
*   **Get Pricing**: Returns the public USD/min rate card from `/api/pricing`.

### Resource: Recording
*   **Get Download URL**: Generates a secure, temporary link (Presigned URL) to download a call recording, given its ID.

## Installation

### Option 1: Via Community Node (Recommended)
1.  In your n8n instance, go to **Settings > Community Nodes**.
2.  Click **Install**.
3.  Paste the package name: `n8n-nodes-aillomvox`.
4.  Wait for installation and restart n8n if necessary.

### Option 2: Manual Installation
If you are developing or running n8n locally:

1.  Clone this repository.
2.  Run `npm install` and `npm run build`.
3.  Create a symlink in your n8n custom nodes folder:
    ```bash
    mkdir -p ~/.n8n/custom
    cd ~/.n8n/custom
    npm install /path/to/n8n-nodes-aillomvox
    ```
4.  Start n8n: `n8n start`.

## Credentials

To use this node, you will need an **AillomVox API Key**.

1.  In the AillomVox node, select **Credentials > Create New**.
2.  Choose **AillomVox API**.
3.  Enter your key (starts with `av_...`).
4.  The **Base URL** field comes pre-filled with `https://vox.aillom.com`. Change only if you are using a self-hosted instance.

## Usage Example

1.  **Webhook Node**: Receives the `call.ended` event from AillomVox.
2.  **AillomVox Node**: Uses the call ID (`{{$json.data.callId}}`) and the **Get Download URL** operation to get the audio link.
3.  **HTTP Request / Upload**: Sends the audio to Google Drive or Dropbox.

## Support

For questions or support, visit: [https://vox.aillom.com/docs](https://vox.aillom.com/docs)
