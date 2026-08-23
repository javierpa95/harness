# [PROJECT_NAME] - Makefile
# The agent fills in actual commands during initialization.
# Works on Windows (make via choco), Linux, Mac.

.PHONY: help init setup setup-file dev install build test lint format typecheck check docker-up docker-down docker-logs docker-restart docker-build docker-clean check-secrets clean

# ==========================================
# Variables — Agent fills these in after init
# ==========================================
WEB_DIR := apps/web
BACKEND_DIR := services/backend

# ==========================================
# Help
# ==========================================
help: ## Show available commands
	@echo [PROJECT_NAME] - Development Commands
	@echo =====================================
	@echo   make help          Show this message
	@echo   make setup         Configure agent models (interactive TUI)
	@echo   make setup-file   Apply models from settings file (no TUI)
	@echo   make init          Initialize project (interactive)
	@echo   make dev           Start development servers
	@echo   make install       Install dependencies
	@echo   make build         Build for production
	@echo   make test          Run tests
	@echo   make lint          Run linter
	@echo   make format        Run formatter
	@echo   make typecheck     Run type check
	@echo   make check         Run all quality checks
	@echo   make docker-up     Start all services
	@echo   make docker-down   Stop all services
	@echo   make docker-logs   Show service logs
	@echo   make docker-restart Restart all services
	@echo   make docker-build  Build Docker images
	@echo   make docker-clean  Stop + remove containers/volumes
	@echo   make check-secrets Scan for secrets
	@echo   make clean         Remove build artifacts

# ==========================================
# Initialization
# ==========================================
init: ## Initialize project (interactive setup)
	@echo Running project setup...
	@if exist init.ps1 (powershell -ExecutionPolicy Bypass -File init.ps1) else (bash init.sh)

setup: ## Configure agent models (interactive TUI)
	@echo Running harness setup...
	@powershell -ExecutionPolicy Bypass -File scripts/setup.ps1

setup-file: ## Apply models from harness.settings.jsonc (non-interactive)
	@echo Applying harness settings from file...
	@powershell -ExecutionPolicy Bypass -File scripts/setup.ps1 -File

# ==========================================
# Development
# ==========================================
dev: ## Start development servers
	@echo Starting dev server...
	@cd $(WEB_DIR) && npm run dev

install: ## Install dependencies
	@echo Installing dependencies...
	@cd $(WEB_DIR) && npm install

# ==========================================
# Build
# ==========================================
build: ## Build for production
	@echo Building for production...
	@cd $(WEB_DIR) && npm run build

# ==========================================
# Quality
# ==========================================
test: ## Run tests
	@echo Running tests...
	@cd $(WEB_DIR) && npm test

lint: ## Run linter
	@echo Running linter...
	@cd $(WEB_DIR) && npm run lint

format: ## Run formatter
	@echo Formatting code...
	@cd $(WEB_DIR) && npm run format

typecheck: ## Run type check
	@echo Running type check...
	@cd $(WEB_DIR) && npx tsc --noEmit

check: lint typecheck ## Run all quality checks

# ==========================================
# Docker
# ==========================================
docker-up: ## Start all services
	@echo Starting services...
	@docker compose up -d

docker-down: ## Stop all services
	@echo Stopping services...
	@docker compose down

docker-logs: ## Show service logs
	@docker compose logs -f --tail=50

docker-restart: ## Restart all services
	@echo Restarting services...
	@docker compose restart

docker-build: ## Build Docker images
	@echo Building images...
	@docker compose build

docker-clean: ## Stop + remove containers and volumes
	@echo Cleaning up...
	@docker compose down -v
	@echo Clean complete

# ==========================================
# Security
# ==========================================
check-secrets: ## Scan for secrets in staged files
	@git grep -iE "password|secret|token|api_key" --cached && echo WARNING: Potential secrets found! && exit 1 || echo OK: No secrets found

# ==========================================
# Cleanup
# ==========================================
clean: ## Remove build artifacts and node_modules
	@echo Cleaning...
	@if exist $(WEB_DIR)\dist rmdir /s /q $(WEB_DIR)\dist
	@if exist $(WEB_DIR)\node_modules rmdir /s /q $(WEB_DIR)\node_modules
	@echo Clean complete
