# Homie - Property Management Platform
# Development and Deployment Commands

.PHONY: help install dev build test lint format clean deploy backup restore logs

# Default target
help: ## Show this help message
	@echo "Homie - Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# =============================================================================
# DEVELOPMENT COMMANDS
# =============================================================================

install: ## Install dependencies for both frontend and backend
	@echo "Installing dependencies..."
	cd frontend && npm ci
	cd backend && npm ci
	@echo "Dependencies installed successfully!"

dev: ## Start development environment with Docker
	@echo "Starting development environment..."
	docker-compose -f docker-compose.dev.yml up -d
	@echo "Development environment started!"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend: http://localhost:5000"

dev-logs: ## View development logs
	docker-compose -f docker-compose.dev.yml logs -f

dev-stop: ## Stop development environment
	docker-compose -f docker-compose.dev.yml down

dev-clean: ## Stop development environment and remove volumes
	docker-compose -f docker-compose.dev.yml down -v
	docker system prune -f

# =============================================================================
# LOCAL DEVELOPMENT (without Docker)
# =============================================================================

dev-frontend: ## Start frontend development server locally
	cd frontend && npm run dev

dev-backend: ## Start backend development server locally
	cd backend && npm run dev

dev-db: ## Start only database and Redis with Docker
	docker-compose up -d postgres redis

# =============================================================================
# TESTING
# =============================================================================

test: ## Run all tests
	@echo "Running frontend tests..."
	cd frontend && npm test
	@echo "Running backend tests..."
	cd backend && npm test

test-coverage: ## Run tests with coverage
	@echo "Running frontend tests with coverage..."
	cd frontend && npm run test:coverage
	@echo "Running backend tests with coverage..."
	cd backend && npm run test:coverage

test-watch: ## Run tests in watch mode
	@echo "Choose service to test:"
	@echo "  make test-watch-frontend"
	@echo "  make test-watch-backend"

test-watch-frontend: ## Run frontend tests in watch mode
	cd frontend && npm run test:watch

test-watch-backend: ## Run backend tests in watch mode
	cd backend && npm run test:watch

# =============================================================================
# CODE QUALITY
# =============================================================================

lint: ## Run linting for both frontend and backend
	@echo "Linting frontend..."
	cd frontend && npm run lint
	@echo "Linting backend..."
	cd backend && npm run lint

lint-fix: ## Fix linting issues
	@echo "Fixing frontend linting issues..."
	cd frontend && npm run lint:fix
	@echo "Fixing backend linting issues..."
	cd backend && npm run lint:fix

format: ## Format code with Prettier
	@echo "Formatting frontend code..."
	cd frontend && npm run format
	@echo "Formatting backend code..."
	cd backend && npm run format

format-check: ## Check code formatting
	@echo "Checking frontend formatting..."
	cd frontend && npm run format:check
	@echo "Checking backend formatting..."
	cd backend && npm run format:check

type-check: ## Run TypeScript type checking
	@echo "Type checking frontend..."
	cd frontend && npm run type-check
	@echo "Type checking backend..."
	cd backend && npm run type-check

# =============================================================================
# BUILD COMMANDS
# =============================================================================

build: ## Build production images
	@echo "Building production images..."
	docker-compose build --no-cache

build-frontend: ## Build frontend only
	cd frontend && npm run build

build-backend: ## Build backend only
	cd backend && npm run build

# =============================================================================
# DEPLOYMENT
# =============================================================================

deploy-dev: ## Deploy to development environment
	./scripts/deploy.sh development

deploy-staging: ## Deploy to staging environment
	./scripts/deploy.sh staging

deploy-prod: ## Deploy to production environment
	./scripts/deploy.sh production

deploy-prod-force: ## Deploy to production environment (force)
	./scripts/deploy.sh production --force

# =============================================================================
# DATABASE OPERATIONS
# =============================================================================

db-migrate: ## Run database migrations
	docker-compose exec backend npm run db:deploy

db-generate: ## Generate Prisma client
	docker-compose exec backend npm run db:generate

db-studio: ## Open Prisma Studio
	docker-compose exec backend npm run db:studio

db-seed: ## Seed database with sample data
	docker-compose exec backend npm run db:seed

db-reset: ## Reset database (WARNING: Destructive)
	@echo "WARNING: This will destroy all data!"
	@read -p "Are you sure? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	docker-compose exec backend npx prisma migrate reset --force

# =============================================================================
# BACKUP & RESTORE
# =============================================================================

backup: ## Create database backup
	@mkdir -p backups
	docker-compose exec postgres pg_dump -U homie_user homie_db > backups/backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "Backup created in backups/ directory"

restore: ## Restore database from backup (usage: make restore FILE=backup.sql)
	@if [ -z "$(FILE)" ]; then echo "Usage: make restore FILE=backup.sql"; exit 1; fi
	docker-compose exec -T postgres psql -U homie_user homie_db < $(FILE)
	@echo "Database restored from $(FILE)"

# =============================================================================
# MONITORING & LOGS
# =============================================================================

logs: ## View application logs
	docker-compose logs -f

logs-frontend: ## View frontend logs
	docker-compose logs -f frontend

logs-backend: ## View backend logs
	docker-compose logs -f backend

logs-db: ## View database logs
	docker-compose logs -f postgres

status: ## Show service status
	docker-compose ps

health: ## Check service health
	@echo "Checking service health..."
	@curl -s http://localhost:3000/api/health || echo "Frontend: DOWN"
	@curl -s http://localhost:5000/api/health || echo "Backend: DOWN"

# =============================================================================
# CLEANUP
# =============================================================================

clean: ## Clean up Docker resources
	docker-compose down
	docker system prune -f
	docker volume prune -f

clean-all: ## Clean up everything (including volumes)
	docker-compose down -v
	docker system prune -af
	docker volume prune -f

clean-deps: ## Clean dependencies and reinstall
	rm -rf frontend/node_modules backend/node_modules
	rm -f frontend/package-lock.json backend/package-lock.json
	make install

# =============================================================================
# SECURITY
# =============================================================================

audit: ## Run security audit
	@echo "Auditing frontend dependencies..."
	cd frontend && npm audit
	@echo "Auditing backend dependencies..."
	cd backend && npm audit

audit-fix: ## Fix security vulnerabilities
	@echo "Fixing frontend vulnerabilities..."
	cd frontend && npm audit fix
	@echo "Fixing backend vulnerabilities..."
	cd backend && npm audit fix

# =============================================================================
# UTILITIES
# =============================================================================

shell-frontend: ## Open shell in frontend container
	docker-compose exec frontend /bin/sh

shell-backend: ## Open shell in backend container
	docker-compose exec backend /bin/sh

shell-db: ## Open PostgreSQL shell
	docker-compose exec postgres psql -U homie_user homie_db

redis-cli: ## Open Redis CLI
	docker-compose exec redis redis-cli

env-example: ## Copy environment example files
	cp .env.example .env
	@echo "Environment file created. Please edit .env with your configuration."

# =============================================================================
# INFORMATION
# =============================================================================

info: ## Show project information
	@echo "=== Homie - Property Management Platform ==="
	@echo "Frontend: Next.js + TypeScript + Tailwind CSS"
	@echo "Backend: Node.js + Express + TypeScript + Prisma"
	@echo "Database: PostgreSQL"
	@echo "Cache: Redis"
	@echo "Deployment: Docker + Docker Compose"
	@echo ""
	@echo "URLs:"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend: http://localhost:5000"
	@echo "  Database: localhost:5432"
	@echo "  Redis: localhost:6379"
	@echo ""
	@echo "For more commands, run: make help"