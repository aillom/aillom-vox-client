# Troubleshooting Guide

Common issues and how to resolve them when using AillomVox.

---

## Authentication Errors

### `401 Unauthorized` / `error: unauthorized`
- **Cause**: API Key is missing, invalid, or expired.
- **Fix**: Check that you're sending `apikey` in your config handshake. Ensure you are copying the key exactly as provided in your dashboard.

### `error: insufficient_balance`
- **Cause**: Your account balance is $0.00 or below.
- **Fix**: Add credits via the [Billing page](https://vox.aillom.com/billing).

---

## Connection Issues

### `Connection Refused` / `Socket Hang Up`
- **Cause**: Server unreachable or firewall blocking outbound port 443 (WSS).
- **Fix**: Ensure you can reach `https://vox.aillom.com/health`. Check your network settings.

### `1008 Policy Violation`
- **Cause**: Sent binary data before the config handshake.
- **Fix**: The **first message** must be a JSON config. Wait for it to be acknowledged before sending audio.

### `1006 Abnormal Closure`
- **Cause**: Generic WebSocket error. Often caused by:
  - Sending malformed JSON
  - Sending audio in wrong format (e.g., MP3 instead of PCM)
  - Network timeout (keep-alive)

---

## Audio Problems

### "Static" or "Noise" instead of Voice
- **Cause**: Wrong encoding or endianness.
- **Fix**: AillomVox expects **PCM 16-bit Signed Little Endian**. 
  - If you send Float32 (Web Audio API default), you get static. Convert to Int16 first.
  - If you send Big Endian, you get static. Use `true` for little-endian in `DataView.setInt16()`.

### High Latency
- **Cause**: Buffering too much audio before sending.
- **Fix**: Send small chunks (20ms–50ms) as soon as recorded. Do not batch 1 second of audio.

### "Choppy" Audio Output
- **Cause**: Network jitter or empty buffer underruns.
- **Fix**: Implement a jitter buffer — wait for 2–3 chunks before starting playback.

### No Audio Received
- **Cause**: `sample_rate` mismatch or missing `system_prompt`.
- **Fix**: Ensure `sample_rate` is `8000`, `16000`, or `24000`. The `system_prompt` field is mandatory.

---

## Tool Call Issues

### AI Hangs After Tool Call
- **Cause**: Missing `tool_result` response.
- **Fix**: Always respond to `tool_call` events with a `tool_result` within 15 seconds:
  ```javascript
  ws.send(JSON.stringify({
    type: "tool_result",
    call_id: msg.call_id,
    result: "Success"
  }));
  ```

### Tools Not Triggering
- **Cause**: Vague tool descriptions or wrong provider.
- **Fix**: Use clear, specific descriptions. Note: Qwen does not support tools — use AillomVox, OpenAI, Gemini, or AWS.

---

## Session Issues

### `max_duration_reached`
- **Cause**: Session exceeded the `max_duration` limit.
- **Fix**: Increase `max_duration` (up to 3600) or handle the farewell message gracefully.

### Multiple Connections Rejected
- **Cause**: Exceeded concurrent connection limit (3 per user, 2 per API key).
- **Fix**: Close unused connections before opening new ones.
