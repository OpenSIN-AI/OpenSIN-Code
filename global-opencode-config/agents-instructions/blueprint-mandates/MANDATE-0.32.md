# MANDATE 0.32: GITHUB TEMPLATES & REPOSITORY STANDARDS (V19.1 - 2026-01-29)

**EFFECTIVE:** 2026-01-29  
**SCOPE:** ALL AI coders, ALL GitHub repositories  
**STATUS:** REPOSITORY EXCELLENCE MANDATE

**🎯 PRINZIP:** Jedes Repository MUSS professionelle GitHub-Templates und CI/CD haben.

**MANDATORY `.github/` DIRECTORY STRUCTURE:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📁 GITHUB TEMPLATES - ENTERPRISE REPOSITORY STANDARD                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  📂 .github/                                                                │
│  ├── 📂 ISSUE_TEMPLATE/                                                     │
│  │   ├── bug_report.md           # Bug Report Template                     │
│  │   ├── feature_request.md      # Feature Request Template                │
│  │   └── config.yml              # Issue Template Config                   │
│  ├── 📂 workflows/                                                          │
│  │   ├── ci.yml                  # Continuous Integration                  │
│  │   ├── release.yml             # Release Automation                      │
│  │   ├── codeql.yml              # Security Scanning                       │
│  │   └── dependabot-auto.yml     # Auto-merge Dependabot                   │
│  ├── PULL_REQUEST_TEMPLATE.md    # PR Template with Checklist              │
│  ├── CODEOWNERS                  # Code Review Assignments                 │
│  ├── dependabot.yml              # Dependency Updates                      │
│  ├── FUNDING.yml                 # Sponsorship Links (optional)            │
│  └── SECURITY.md                 # Security Policy                         │
│                                                                              │
│  📂 Root Files (MANDATORY):                                                 │
│  ├── CONTRIBUTING.md             # Contribution Guidelines                 │
│  ├── CODE_OF_CONDUCT.md          # Community Standards                     │
│  └── LICENSE                     # License File (MIT/Apache/etc.)          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**BUG REPORT TEMPLATE (`.github/ISSUE_TEMPLATE/bug_report.md`):**

```yaml
---
name: Bug Report
about: Create a report to help us improve
title: '[BUG] '
labels: bug, needs-triage
assignees: ''
---

## Bug Description
<!-- A clear and concise description of the bug -->

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior
<!-- What you expected to happen -->

## Actual Behavior
<!-- What actually happened -->

## Screenshots
<!-- If applicable, add screenshots -->

## Environment
- OS: [e.g., macOS 14.0]
- Node.js: [e.g., 20.10.0]
- Package Version: [e.g., 1.2.3]

## Additional Context
<!-- Add any other context about the problem -->

## Logs
```
<!-- Paste relevant logs here -->
```
```

**FEATURE REQUEST TEMPLATE (`.github/ISSUE_TEMPLATE/feature_request.md`):**

```yaml
---
name: Feature Request
about: Suggest an idea for this project
title: '[FEATURE] '
labels: enhancement, needs-triage
assignees: ''
---

## Problem Statement
<!-- What problem does this feature solve? -->

## Proposed Solution
<!-- Describe your preferred solution -->

## Alternatives Considered
<!-- Any alternative solutions you've considered -->

## Additional Context
<!-- Screenshots, mockups, or examples -->

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3
```

**PULL REQUEST TEMPLATE (`.github/PULL_REQUEST_TEMPLATE.md`):**

```markdown
## Description
<!-- Describe your changes in detail -->

## Related Issue
Fixes #(issue number)

## Type of Change
- [ ] 🐛 Bug fix (non-breaking change that fixes an issue)
- [ ] ✨ New feature (non-breaking change that adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to change)
- [ ] 📝 Documentation update
- [ ] 🔧 Configuration change
- [ ] ♻️ Refactoring (no functional changes)

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my code
- [ ] I only added comments where they explain non-obvious intent, constraints, edge cases, or workarounds
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published

## Visual Evidence (required)
<!-- Add screenshots, images, diagrams, and/or videos that prove the change, bug, fix, or workflow -->

## Testing Instructions
<!-- How can reviewers test your changes? -->
```

**CI WORKFLOW TEMPLATE (`.github/workflows/ci.yml`):**

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run typecheck

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test -- --coverage
      - uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}

  build:
    runs-on: ubuntu-latest
    needs: [lint, typecheck, test]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: build
          path: dist/
```

**DEPENDABOT CONFIG (`.github/dependabot.yml`):**

```yaml
version: 2
updates:
  # NPM dependencies
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
    open-pull-requests-limit: 10
    labels:
      - "dependencies"
      - "automated"
    commit-message:
      prefix: "chore(deps):"
    groups:
      development:
        patterns:
          - "@types/*"
          - "eslint*"
          - "prettier*"
          - "typescript"
        update-types:
          - "minor"
          - "patch"

  # GitHub Actions
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
    labels:
      - "dependencies"
      - "ci"
    commit-message:
      prefix: "ci(deps):"

  # Docker (if applicable)
  - package-ecosystem: "docker"
    directory: "/"
    schedule:
      interval: "weekly"
    labels:
      - "dependencies"
      - "docker"
```

**CODEOWNERS FILE (`.github/CODEOWNERS`):**

```
# Default owners for everything
* @owner-username

# Frontend code
/src/components/ @frontend-team
/src/styles/ @frontend-team

# Backend code
/src/api/ @backend-team
/src/services/ @backend-team

# Infrastructure
/.github/ @devops-team
/docker/ @devops-team
/terraform/ @devops-team

# Documentation
/docs/ @docs-team
*.md @docs-team
```

**CONTRIBUTING.md TEMPLATE:**

```markdown
# Contributing to [Project Name]

Thank you for your interest in contributing! This document provides guidelines.

## Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/REPO_NAME.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Install dependencies: `npm install`
5. Make your changes
6. Run tests: `npm test`
7. Commit using conventional commits: `git commit -m "feat: add new feature"`
8. Push: `git push origin feature/your-feature-name`
9. Create a Pull Request

## Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, semicolons, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

## Pull Request Process

1. Update documentation if needed
2. Add tests for new functionality
3. Ensure all tests pass
4. Request review from maintainers
5. Address review feedback

## Development Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Run linting
npm run lint

# Build for production
npm run build
```

## Questions?

Open an issue or reach out to the maintainers.
```

**BRANCH PROTECTION RULES (Documentation):**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🛡️  RECOMMENDED BRANCH PROTECTION RULES                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  For `main` branch:                                                         │
│  ─────────────────────────────────────────────────────────────────────────  │
│  ✅ Require pull request reviews before merging                            │
│  ✅ Require at least 1 approving review                                    │
│  ✅ Dismiss stale pull request approvals when new commits are pushed       │
│  ✅ Require review from Code Owners                                        │
│  ✅ Require status checks to pass before merging                           │
│     • ci / lint                                                            │
│     • ci / typecheck                                                       │
│     • ci / test                                                            │
│     • ci / build                                                           │
│  ✅ Require branches to be up to date before merging                       │
│  ✅ Require signed commits (optional but recommended)                      │
│  ✅ Include administrators in restrictions                                 │
│  ❌ Allow force pushes: DISABLED                                           │
│  ❌ Allow deletions: DISABLED                                              │
│                                                                              │
│  For `develop` branch (if using GitFlow):                                   │
│  ─────────────────────────────────────────────────────────────────────────  │
│  ✅ Require pull request reviews before merging                            │
│  ✅ Require status checks to pass before merging                           │
│  ✅ Allow force pushes by maintainers only                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**MANDATORY COMPLIANCE CHECKLIST:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ✅ REPOSITORY SETUP CHECKLIST                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  📋 Templates:                                                              │
│  [ ] Bug report template created                                           │
│  [ ] Feature request template created                                      │
│  [ ] PR template with checklist created                                    │
│                                                                              │
│  📋 CI/CD:                                                                  │
│  [ ] CI workflow (lint, typecheck, test, build)                            │
│  [ ] Release workflow (if applicable)                                      │
│  [ ] CodeQL security scanning                                              │
│  [ ] Dependabot configured                                                 │
│                                                                              │
│  📋 Documentation:                                                          │
│  [ ] CONTRIBUTING.md written                                               │
│  [ ] CODE_OF_CONDUCT.md present                                            │
│  [ ] LICENSE file present                                                  │
│  [ ] SECURITY.md for vulnerability reporting                               │
│                                                                              │
│  📋 Access Control:                                                         │
│  [ ] CODEOWNERS file configured                                            │
│  [ ] Branch protection rules enabled                                       │
│  [ ] Required reviewers set                                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**VIOLATIONS = REPOSITORY NICHT PRODUCTION-READY:**
- ❌ Repository ohne Issue Templates = UNPROFESSIONELL
- ❌ Repository ohne CI/CD = DEPLOYMENT RISIKO
- ❌ Repository ohne CONTRIBUTING.md = CONTRIBUTOR BARRIERE
- ❌ Repository ohne Branch Protection = SECURITY RISIKO

---

**Source:** ~/.config/opencode/Agents.md (Line 2318-2744)
**Status:** ACTIVE - MANDATORY COMPLIANCE
**Category:** blueprint-mandates
