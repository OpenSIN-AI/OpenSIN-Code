# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously. If you discover a vulnerability in OpenSIN Code, please follow these steps:

1. **DO NOT** open a public issue
2. Email: `security@opensin.ai` (or use GitHub Security Advisories)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## Response Timeline

- **Initial response:** Within 48 hours
- **Assessment:** Within 5 business days
- **Fix deployment:** Depends on severity (critical: 7 days, high: 14 days, medium: 30 days)

## Security Best Practices

- Never commit API keys, tokens, or secrets to the repository
- Use environment variables for sensitive configuration
- Review all dependencies for known vulnerabilities
- Keep all packages up to date
- Use the built-in permission system to restrict tool access

## Responsible Disclosure

We follow a responsible disclosure policy. Security researchers who report valid vulnerabilities will be credited in our security acknowledgments.
