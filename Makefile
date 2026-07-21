# [PROJECT_NAME] - Makefile
# The agent fills in actual commands during initialization.
# Works on Linux, Mac, and Windows via Git Bash (make ships a POSIX shell there).
# Native PowerShell without Git Bash: use init.ps1 / scripts/dev.ps1 directly instead of make.

.PHONY: help init dev install build test lint format typecheck check docker-up docker-down docker-logs docker-restart docker-build docker-clean check-secrets agents memory hooks audit review backend-test git-setup git-lint-commits git-lint-all ci-enable ci-enable-basic ci-enable-advanced ci-disable ci-status clean

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
	@echo "  Git"
	@echo "  ---"
	@echo "  make git-setup     Setup git hooks (run after npm install)"
	@echo "  make git-lint-commits Lint last commit message"
	@echo "  make git-lint-all  Lint all recent commit messages"
	@echo ""
	@echo "  CI/CD"
	@echo "  -----"
	@echo "  make ci-status       Check CI pipeline status"
	@echo "  make ci-enable-basic Enable basic CI (lint+test)"
	@echo "  make ci-enable-adv   Enable advanced CI (security+coverage)"
	@echo "  make ci-enable       Enable basic CI (alias)"
	@echo "  make ci-disable      Disable all CI pipelines"
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

# ==========================================
# Git
# ==========================================
git-setup: ## Setup git hooks (run after npm install)
	@echo "Setting up git hooks..."
	@npx husky
	@echo "✅ Git hooks installed"

git-lint-commits: ## Lint last commit message
	@echo "Linting last commit message..."
	@npx commitlint --from HEAD~1 --to HEAD --verbose

git-lint-all: ## Lint all commit messages
	@echo "Linting all commit messages..."
	@npx commitlint --from HEAD~10 --to HEAD --verbose

# ==========================================
# CI/CD
# ==========================================
ci-enable: ## Enable GitHub Actions CI pipeline
	@echo "Enabling CI pipeline..."
	@if [ -f ".github/workflows/ci.yml.disabled" ]; then \
		mv .github/workflows/ci.yml.disabled .github/workflows/ci.yml; \
		echo "✅ CI pipeline enabled"; \
	else \
		echo "⚠️  CI pipeline already enabled or file not found"; \
	fi

ci-disable: ## Disable GitHub Actions CI pipeline
	@echo "Disabling CI pipeline..."
	@if [ -f ".github/workflows/ci.yml" ]; then \
		mv .github/workflows/ci.yml .github/workflows/ci.yml.disabled; \
		echo "✅ CI pipeline disabled"; \
	else \
		echo "⚠️  CI pipeline already disabled or file not found"; \
	fi

ci-status: ## Check CI pipeline status
	@if [ -f ".github/workflows/ci.yml" ]; then \
		echo "✅ CI pipeline: ENABLED"; \
	elif [ -f ".github/workflows/ci.yml.disabled" ]; then \
		echo "⏸️  CI pipeline: DISABLED (run 'make ci-enable' to activate)"; \
	else \
		echo "❌ CI pipeline: NOT FOUND"; \
	fi

# ==========================================
# CI/CD (actualizado)
# ==========================================
ci-enable: ci-enable-basic ## Enable CI pipeline (basic by default)

ci-enable-basic: ## Enable basic CI pipeline (lint + typecheck + test)
	@echo "Enabling basic CI pipeline..."
	@if [ -f ".github/workflows/ci-basic.yml.disabled" ]; then \
		mv .github/workflows/ci-basic.yml.disabled .github/workflows/ci-basic.yml; \
		echo "✅ Basic CI enabled"; \
	else \
		echo "⚠️  Basic CI already enabled or not found"; \
	fi

ci-enable-advanced: ## Enable advanced CI pipeline (security + coverage + Docker)
	@echo "Enabling advanced CI pipeline..."
	@if [ -f ".github/workflows/ci-advanced.yml.disabled" ]; then \
		mv .github/workflows/ci-advanced.yml.disabled .github/workflows/ci-advanced.yml; \
		echo "✅ Advanced CI enabled"; \
	else \
		echo "⚠️  Advanced CI already enabled or not found"; \
	fi

ci-disable: ## Disable all CI pipelines
	@echo "Disabling all CI pipelines..."
	@mv .github/workflows/ci-basic.yml .github/workflows/ci-basic.yml.disabled 2>/dev/null || true
	@mv .github/workflows/ci-advanced.yml .github/workflows/ci-advanced.yml.disabled 2>/dev/null || true
	@mv .github/workflows/ci.yml .github/workflows/ci.yml.disabled 2>/dev/null || true
	@echo "✅ All CI pipelines disabled"

ci-status: ## Check CI pipeline status
	@echo "CI Pipeline Status:"
	@echo "==================="
	@if [ -f ".github/workflows/ci-basic.yml" ]; then \
		echo "✅ Basic CI:     ENABLED"; \
	elif [ -f ".github/workflows/ci-basic.yml.disabled" ]; then \
		echo "⏸️  Basic CI:     DISABLED"; \
	else \
		echo "❌ Basic CI:     NOT FOUND"; \
	fi
	@if [ -f ".github/workflows/ci-advanced.yml" ]; then \
		echo "✅ Advanced CI:  ENABLED"; \
	elif [ -f ".github/workflows/ci-advanced.yml.disabled" ]; then \
		echo "⏸️  Advanced CI:  DISABLED"; \
	else \
		echo "❌ Advanced CI:  NOT FOUND"; \
	fi
