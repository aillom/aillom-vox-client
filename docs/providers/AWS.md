# AWS Bedrock (Nova Sonic)

Enterprise-grade Speech-to-Speech using Amazon's latest **Nova Sonic** model (`amazon.nova-2-sonic-v1:0`).

## Configuration

```json
{
  "provider": "aws",
  "voice": "matthew",
  "system_prompt": "You are a helpful assistant.",
  "sample_rate": 16000
}
```

## Voices

| Voice | Gender | Style |
| :--- | :--- | :--- |
| **matthew** | Male | Neutral, professional |
| **ruth** | Female | Professional, clear |
| **tiffany** | Female | Warm, friendly |

## Features
- **Low Latency**: Faster than previous Polly+Bedrock chains.
- **Reliability**: Highest uptime guarantee.
- **Security**: Data privacy compliance (HIPAA, GDPR options available via AWS config).
- **Tool Use**: Full support for function calling.

## Best For
- **Enterprise**: Banking, healthcare, corporate environments.
- **Stability**: When 99.99% uptime is required.
