# Changelog

All notable changes to FrameVault will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Initial project scaffolding
- Frontend: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- Frontend: Design system with dark/light mode support
- Frontend: Authentication pages (login, register)
- Frontend: Dashboard, Collections, Assets, Favorites, Trash, Settings page shells
- Frontend: Responsive sidebar layout with collapsible navigation
- Backend: FastAPI application with PostgreSQL
- Backend: JWT authentication (register, login, logout)
- Backend: Collections CRUD API
- Backend: Assets API with S3 presigned URL upload flow
- Backend: Storage abstraction (LocalStorageService + S3StorageService)
- Docker: Multi-stage frontend Dockerfile (Node build → Nginx serve)
- Docker: Backend Dockerfile
- Docker: Docker Compose for local development
- Docker: Docker Compose for production
- CI/CD: GitHub Actions CI pipeline (lint, typecheck, test, build)
- CI/CD: GitHub Actions CD pipeline (ECR push, EC2 deploy)
- Docs: Architecture documentation
- Docs: AWS deployment guide
- Docs: Security documentation
- Docs: Development guide
- Docs: API documentation
- Docs: Architecture Decision Records (ADRs 001–005)
- Open source: README, LICENSE, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY

---

## [0.1.0] - TBD

_Initial public release._

[unreleased]: https://github.com/your-org/framevault/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/your-org/framevault/releases/tag/v0.1.0
