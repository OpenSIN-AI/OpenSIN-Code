# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x.x   | ✅        |

## Reporting a Vulnerability

Please report security vulnerabilities by opening a GitHub Issue with the `security` label, or contact us directly.

We will respond within 48 hours and work to resolve the issue as quickly as possible.

## Security Best Practices

- Never commit API keys or secrets
- Use environment variables for sensitive data
- Validate all inputs with Zod schemas
- Run `bun audit` regularly
- Keep dependencies updated via Dependabot

## Guardrails

All agents must have:
- Prompt injection detection
- Jailbreak pattern detection
- PII detection
- Toxicity scoring
- Sandboxing for untrusted code execution
