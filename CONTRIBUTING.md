# Contributing to FrameVault

Thank you for your interest in contributing to FrameVault! This document provides guidelines and information for contributors.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Branch Strategy](#branch-strategy)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Code Style](#code-style)
- [Testing](#testing)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Enhancements](#suggesting-enhancements)

---

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold this code.

---

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/framevault.git`
3. Set up the development environment (see [Development Setup](#development-setup))
4. Create a feature branch: `git checkout -b feature/your-feature-name`
5. Make your changes
6. Run tests and linting
7. Submit a pull request

---

## Development Setup

See [docs/development.md](docs/development.md) for detailed setup instructions.

**Quick start:**

```bash
# Copy environment variables
cp .env.example .env

# Install all dependencies
make install

# Start development services
docker compose up -d db
make dev
```

---

## Branch Strategy

```
main
  │
  ├── feature/*    New features
  ├── fix/*        Bug fixes
  └── chore/*      Maintenance, documentation, dependencies
```

- `main` is the production branch — all PRs target `main`
- CI must pass before a PR can be merged
- Keep feature branches short-lived

---

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add collection cover image upload
fix: handle failed S3 presigned URL generation
docs: update AWS deployment guide
chore: upgrade React to 18.3
ci: add Docker security scan step
refactor: extract asset service from routes
test: add collection CRUD integration tests
```

**Do not use:**
- `update`
- `changes`
- `final`
- `WIP` (unless a draft PR)

---

## Pull Request Process

1. **Open an issue first** for significant changes to align on approach
2. Keep PRs focused — one feature or fix per PR
3. Include a clear description of what changed and why
4. Link any related issues
5. Ensure all CI checks pass
6. Add or update tests for your changes
7. Update documentation if required

---

## Code Style

### Frontend (TypeScript/React)
- ESLint + Prettier are configured — run `make lint` and `make format`
- TypeScript strict mode — no `any` types
- Components: functional components with hooks
- File naming: `PascalCase.tsx` for components, `camelCase.ts` for utilities

### Backend (Python)
- Ruff for linting and formatting — run `make lint` and `make format`
- Type hints everywhere — functions must be fully typed
- Docstrings for public functions and classes
- Follow the existing repository/service/route separation

---

## Testing

All PRs must maintain or improve test coverage.

```bash
# Run all tests
make test

# Frontend tests only
make test-frontend

# Backend tests only
make test-backend
```

Critical paths that must have test coverage:
- Authentication (register, login, token refresh)
- Collection CRUD
- Asset upload/download/delete
- Authorization (users can only access their own resources)

---

## Reporting Bugs

Please open a GitHub issue using the **Bug Report** template. Include:

- Description of the problem
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment (OS, browser, Docker version)
- Relevant logs

**Security vulnerabilities** must NOT be reported as public issues. See [SECURITY.md](SECURITY.md).

---

## Suggesting Enhancements

Open a GitHub issue using the **Feature Request** template. Include:

- Clear description of the feature
- Problem it solves
- Proposed implementation approach (optional)
- Any alternatives considered

Note that FrameVault is intentionally scoped as a DevOps portfolio project. Features that add significant complexity without clear architectural value may be declined.

---

## Questions?

Open a [GitHub Discussion](https://github.com/your-org/framevault/discussions) for questions, ideas, or general conversation.
