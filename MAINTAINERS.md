# Maintainers

## Core Team

| Name | Role | GitHub |
|------|------|--------|
| Jeremy | Lead Developer | @OpenSIN-AI |

## Responsibilities

- Review and merge pull requests
- Triage issues
- Release management
- Security vulnerability response

## Release Process

1. Bump version in package.json
2. Update CHANGELOG.md
3. Create release tag: `git tag v0.x.0 && git push origin v0.x.0`
4. Publish to npm: `npm publish`
