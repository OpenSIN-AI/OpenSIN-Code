# Contributing to OpenSIN-Code

Thank you for your interest in contributing to OpenSIN-Code!

## Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes
4. Run tests: `bun run test`
5. Run typecheck: `bun run typecheck`
6. Commit and push: `git commit -m "feat: description" && git push`
7. Open a Pull Request

## Code Style

- TypeScript with strict mode enabled
- No `any` types — use proper type definitions
- No `as unknown as` casts — use type guards
- All functions must have return types
- Use single quotes for strings
- 2-space indentation

## Testing

- All new features require tests
- Run `bun run test` before submitting a PR
- Minimum 80% code coverage for new code

## Commit Messages

Follow conventional commits:
- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation
- `test:` test changes
- `refactor:` code refactoring
- `chore:` maintenance

## Pull Request Process

1. Ensure all tests pass
2. Update documentation if needed
3. Request review from maintainers
4. PRs require at least 1 approval before merge

## Reporting Issues

- Use the issue templates
- Include reproduction steps
- Include expected vs actual behavior
- Include environment info (Node.js version, OS)
