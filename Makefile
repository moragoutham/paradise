# =============================================================================
# FrameVault — Makefile
# Convenience commands for development, testing, and deployment.
# =============================================================================

.PHONY: help install dev build test lint format \
        docker-build docker-up docker-down docker-logs \
        backend-shell db-shell clean

# Default target — show help
help:
	@echo ""
	@echo "  FrameVault — Available Commands"
	@echo "  ──────────────────────────────────────────────────────"
	@echo "  make install        Install all dependencies (frontend + backend)"
	@echo "  make dev            Start development servers (frontend + backend)"
	@echo "  make build          Build frontend production bundle"
	@echo "  make test           Run all tests (frontend + backend)"
	@echo "  make lint           Lint all code (frontend + backend)"
	@echo "  make format         Format all code (frontend + backend)"
	@echo "  make docker-build   Build Docker images"
	@echo "  make docker-up      Start all services via Docker Compose"
	@echo "  make docker-down    Stop all services"
	@echo "  make logs           Tail Docker Compose logs"
	@echo "  make backend-shell  Open a shell in the backend container"
	@echo "  make db-shell       Open a psql shell in the database container"
	@echo "  make clean          Remove build artifacts and caches"
	@echo ""

# ── Install ───────────────────────────────────────────────────────────────────
install: install-frontend install-backend

install-frontend:
	@echo "→ Installing frontend dependencies..."
	cd frontend && npm ci

install-backend:
	@echo "→ Installing backend dependencies..."
	cd backend && pip install -r requirements.txt

# ── Development ───────────────────────────────────────────────────────────────
dev:
	@echo "→ Starting development servers..."
	@echo "  Frontend: http://localhost:5173"
	@echo "  Backend:  http://localhost:8000"
	@echo "  API Docs: http://localhost:8000/docs"
	@$(MAKE) -j2 dev-frontend dev-backend

dev-frontend:
	cd frontend && npm run dev

dev-backend:
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# ── Build ─────────────────────────────────────────────────────────────────────
build: build-frontend

build-frontend:
	@echo "→ Building frontend production bundle..."
	cd frontend && npm run build

# ── Test ──────────────────────────────────────────────────────────────────────
test: test-frontend test-backend

test-frontend:
	@echo "→ Running frontend tests..."
	cd frontend && npm run test

test-backend:
	@echo "→ Running backend tests..."
	cd backend && pytest tests/ -v

# ── Lint ──────────────────────────────────────────────────────────────────────
lint: lint-frontend lint-backend

lint-frontend:
	@echo "→ Linting frontend..."
	cd frontend && npm run lint

lint-backend:
	@echo "→ Linting backend..."
	cd backend && ruff check .

# ── Format ────────────────────────────────────────────────────────────────────
format: format-frontend format-backend

format-frontend:
	@echo "→ Formatting frontend..."
	cd frontend && npm run format

format-backend:
	@echo "→ Formatting backend..."
	cd backend && ruff format .

# ── Type Check ────────────────────────────────────────────────────────────────
typecheck:
	@echo "→ Type checking frontend..."
	cd frontend && npm run typecheck

# ── Docker ────────────────────────────────────────────────────────────────────
docker-build:
	@echo "→ Building Docker images..."
	docker compose build

docker-up:
	@echo "→ Starting all services..."
	docker compose up -d
	@echo ""
	@echo "  Services started:"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend:  http://localhost:8000"
	@echo "  API Docs: http://localhost:8000/docs"

docker-down:
	@echo "→ Stopping all services..."
	docker compose down

docker-up-prod:
	@echo "→ Starting production services..."
	docker compose -f docker-compose.prod.yml up -d

docker-down-prod:
	docker compose -f docker-compose.prod.yml down

logs:
	docker compose logs -f

backend-shell:
	docker compose exec backend bash

db-shell:
	docker compose exec db psql -U framevault -d framevault

# ── Database Migrations ───────────────────────────────────────────────────────
db-migrate:
	@echo "→ Running database migrations..."
	cd backend && alembic upgrade head

db-rollback:
	@echo "→ Rolling back last migration..."
	cd backend && alembic downgrade -1

db-revision:
	@echo "→ Creating new migration (usage: make db-revision MSG='your message')..."
	cd backend && alembic revision --autogenerate -m "$(MSG)"

# ── Clean ─────────────────────────────────────────────────────────────────────
clean:
	@echo "→ Cleaning build artifacts..."
	rm -rf frontend/dist
	rm -rf frontend/node_modules/.cache
	find backend -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find backend -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
	find backend -type d -name .ruff_cache -exec rm -rf {} + 2>/dev/null || true
	@echo "→ Clean complete."
