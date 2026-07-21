# [PROJECT_NAME] - Makefile
# The agent fills in actual commands during initialization.
# Works on Linux, Mac, and Windows via Git Bash (make ships a POSIX shell there).
# Native PowerShell without Git Bash: use init.ps1 / scripts/dev.ps1 directly instead of make.

.PHONY: help init dev install build test lint format typecheck check docker-up docker-down docker-logs docker-restart docker-build docker-clean check-secrets agents memory hooks audit review backend-test clean

# ==========================================
# Variables — Agent fills these in after init
# ==========================================
WEB_DIR := apps/web
BACKEND_DIR := services/backend

# ==========================================
# Help
# ==========================================
help: ## Show available commands
	@echo "[PROJECT_NAME] - Development Commands"
	@echo "====================================="
	@echo ""
	@echo "  Setup"
	@echo "  ----"
	@echo "  make init          Initialize project (interactive)"
	@echo "  make install       Install dependencies"
	@echo ""
	@echo "  Development"
	@echo "  -----------"
	@echo "  make dev           Start development servers"
	@echo "  make build         Build for production"
	@echo "  make backend-test  Run backend tests"
	@echo ""
	@echo "  Quality"
	@echo "  -------"
	@echo "  make test          Run all tests"
	@echo "  make lint          Run linter"
	@echo "  make format        Run formatter"
	@echo "  make typecheck     Run type check"
	@echo "  make check         Run all quality checks (lint + typecheck + test)"
	@echo ""
	@echo "  Agents"
	@echo "  ------"
	@echo "  make agents        List available agents"
	@echo "  make memory        Show agent memory status"
	@echo "  make hooks         Show active hooks"
	@echo "  make review        Run code review on recent changes"
	@echo "  make audit         Run GDPR audit on recent changes"
	@echo ""
	@echo "  Docker"
	@echo "  ------"
	@echo "  make docker-up     Start all services"
	@echo "  make docker-down   Stop all services"
	@echo "  make docker-logs   Show service logs"
	@echo "  make docker-restart Restart all services"
	@echo "  make docker-build  Build Docker images"
	@echo "  make docker-clean  Stop + remove containers/volumes"
	@echo ""
	@echo "  Security"
	@echo "  --------"
	@echo "  make check-secrets Scan for secrets"
	@echo ""
	@echo "  Cleanup"
	@echo "  -------"
	@echo "  make clean         Remove build artifacts"
# ==========================================
# Initialization
# ==========================================
init: ## Initialize project (interactive setup)
	@echo Running project setup...
	@bash init.sh

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

backend-test: ## Run backend tests
	@echo Running backend tests...
	@cd $(BACKEND_DIR) && npm test

lint: ## Run linter
	@echo Running linter...
	@cd $(WEB_DIR) && npm run lint

format: ## Run formatter
	@echo Formatting code...
	@cd $(WEB_DIR) && npm run format

typecheck: ## Run type check
	@echo Running type check...
	@cd $(WEB_DIR) && npx tsc --noEmit

check: lint typecheck test ## Run all quality checks

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

# ==========================================
# Agents
# ==========================================
agents: ## List available agents
	@echo "Claude Code agents:"
	@ls -1 .claude/agents/*.md 2>/dev/null | xargs -I{} basename {} .md || echo "  (none)"
	@echo ""
	@echo "OpenCode agents:"
	@ls -1 .opencode/agents/*.md 2>/dev/null | xargs -I{} basename {} .md || echo "  (none)"

memory: ## Show agent memory status
	@echo "Agent Memory:"
	@echo "============="
	@for dir in agent-memory/*/; do \
		if [ -d "$$dir" ]; then \
			echo ""; \
			echo "=== $$(basename $$dir) ==="; \
			head -10 "$$dir/MEMORY.md" 2>/dev/null || echo "  (empty)"; \
		fi; \
	done

hooks: ## Show active hooks
	@echo "Active Hooks:"
	@echo "============="
	@cat .claude/settings.json 2>/dev/null | jq '.hooks' || echo "  (no hooks configured)"

review: ## Run code review on recent changes
	@echo "Running code review on last commit..."
	@git diff HEAD~1 | head -500 | claude -p "Review this diff for bugs, security issues, and spec compliance. Report in 2 axes: Standards and Spec." --max-turns 10 2>/dev/null || echo "  (requires Claude Code CLI)"

audit: ## Run GDPR audit on recent changes
	@echo "Running GDPR audit on staged changes..."
	@git diff --cached | head -500 | claude -p "Audit this diff for GDPR compliance: credentials, privacy, security anti-patterns." --max-turns 5 2>/dev/null || echo "  (requires Claude Code CLI)"

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
	@rm -rf $(WEB_DIR)/dist
	@rm -rf $(WEB_DIR)/node_modules
	@rm -rf $(BACKEND_DIR)/dist
	@rm -rf $(BACKEND_DIR)/node_modules
	@echo Clean complete
