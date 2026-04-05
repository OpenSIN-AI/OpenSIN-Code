# Contributing to OpenSIN Code

Thank you for your interest in contributing to OpenSIN Code! This document provides guidelines and instructions for contributing.

## Code of Conduct

This project follows our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to abide by its terms.

## How to Contribute

### Reporting Bugs

- Search existing issues first to avoid duplicates
- Use the bug report template
- Include: steps to reproduce, expected behavior, actual behavior, environment details
- Attach screenshots or logs when applicable

### Suggesting Features

- Open a feature request issue with the `enhancement` label
- Describe the problem your feature solves
- Provide examples of how the feature should work

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature-name`
3. Make your changes with clear, descriptive commits
4. Ensure all tests pass: `npm test`
5. Ensure TypeScript compiles: `npx tsc --noEmit`
6. Push to your fork and submit a pull request
7. Link your PR to the relevant issue

### Commit Messages

Follow conventional commits:
- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation changes
- `style:` — formatting, no code change
- `refactor:` — code restructuring, no functional change
- `test:` — adding or updating tests
- `chore:` — maintenance tasks

### Branch Naming

- `feat/short-description` — new features
- `fix/short-description` — bug fixes
- `docs/short-description` — documentation
- `refactor/short-description` — refactoring

## Development Setup

```bash
# Clone the repository
git clone https://github.com/OpenSIN-AI/OpenSIN-Code.git
cd OpenSIN-Code

# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm test
```

## Project Structure

```
packages/
  opensin-cli/      — CLI coding agent
  opensin-sdk/      — SDK for building agents
  kairos-vscode/    — VS Code extension
  opensin-code-vscode/ — VS Code integration
```

## Code Style

- TypeScript strict mode enabled
- ESLint rules enforced
- Prettier for formatting
- No `any` types without justification
- All public APIs must have JSDoc comments

## Testing

- Unit tests with Vitest
- Integration tests for CLI commands
- E2E tests for critical flows
- Minimum 80% coverage target

## Release Process

1. Bump version in `package.json`
2. Update `CHANGELOG.md`
3. Create a release tag: `git tag -a v0.x.0 -m "Release v0.x.0"`
4. Push tag: `git push origin v0.x.0`
5. GitHub Actions handles the rest

## Questions?

Open an issue with the `question` label or reach out on our community channels.
