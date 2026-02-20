.PHONY: dev dev-backend dev-frontend test lint build clean

# ── Development ─────────────────────────────────────────

dev: ## Start both backend and frontend in development mode
	@echo "Starting DocuMind development servers..."
	@make dev-backend &
	@make dev-frontend

dev-backend: ## Start FastAPI backend with auto-reload
	cd backend && uvicorn app.main:app --reload --port 8000

dev-frontend: ## Start Next.js frontend
	cd frontend && npm run dev

# ── Testing ─────────────────────────────────────────────

test: ## Run all tests
	cd backend && python -m pytest tests/ -v

test-cov: ## Run tests with coverage
	cd backend && python -m pytest tests/ -v --cov=app --cov-report=term-missing

# ── Linting ─────────────────────────────────────────────

lint: ## Lint both projects
	cd backend && ruff check .
	cd frontend && npm run lint

# ── Docker ──────────────────────────────────────────────

build: ## Build Docker images
	docker-compose build

up: ## Start with Docker Compose
	docker-compose up -d

down: ## Stop Docker Compose
	docker-compose down

# ── Setup ───────────────────────────────────────────────

setup-backend: ## Install backend dependencies
	cd backend && pip install -r requirements.txt

setup-frontend: ## Install frontend dependencies
	cd frontend && npm install

setup: setup-backend setup-frontend ## Install all dependencies

# ── Utilities ───────────────────────────────────────────

clean: ## Remove build artifacts and data
	rm -rf backend/data
	rm -rf frontend/.next
	rm -rf frontend/node_modules

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
