#!/usr/bin/env bash
# init.sh — SDD Agent Harness Project Setup
# Interactive script to configure a new project from the template.
# Configures BOTH OpenCode and Claude Code.

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}🚀 SDD Agent Harness — Project Setup${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ── Project Identity ──
echo -e "${GREEN}📝 Project Identity${NC}"

read -rp "  Project name (kebab-case, e.g. my-app): " PROJECT_NAME
while [ -z "$PROJECT_NAME" ]; do
  echo -e "  ${RED}Project name is required.${NC}"
  read -rp "  Project name (kebab-case, e.g. my-app): " PROJECT_NAME
done

read -rp "  One-line description: " PROJECT_DESC
while [ -z "$PROJECT_DESC" ]; do
  echo -e "  ${RED}Description is required.${NC}"
  read -rp "  One-line description: " PROJECT_DESC
done

echo ""
echo -e "  ${YELLOW}Project type:${NC}"
echo "    1) web-app"
echo "    2) api"
echo "    3) full-stack"
echo "    4) cli"
echo "    5) mobile"
echo "    6) desktop"
read -rp "  Select [1-6] (default: 3): " TYPE_NUM
case "$TYPE_NUM" in
  1) PROJECT_TYPE="web-app" ;;
  2) PROJECT_TYPE="api" ;;
  3) PROJECT_TYPE="full-stack" ;;
  4) PROJECT_TYPE="cli" ;;
  5) PROJECT_TYPE="mobile" ;;
  6) PROJECT_TYPE="desktop" ;;
  *) PROJECT_TYPE="full-stack" ;;
esac

echo ""
echo -e "  ${YELLOW}UI language:${NC}"
echo "    1) English"
echo "    2) Spanish"
echo "    3) Multi-language"
read -rp "  Select [1-3] (default: 1): " LANG_NUM
case "$LANG_NUM" in
  1) UI_LANG="English" ;;
  2) UI_LANG="Spanish" ;;
  3) UI_LANG="Multi-language" ;;
  *) UI_LANG="English" ;;
esac

# ── Stack ──
echo ""
echo -e "${GREEN}🛠 Stack${NC}"

echo ""
echo -e "  ${YELLOW}Frontend framework:${NC}"
echo "    1) Next.js"
echo "    2) Astro"
echo "    3) React (Vite)"
echo "    4) Vue"
echo "    5) Svelte"
echo "    6) None (no frontend)"
read -rp "  Select [1-6] (default: 1): " FE_NUM
case "$FE_NUM" in
  1) FRONTEND="Next.js" ;;
  2) FRONTEND="Astro" ;;
  3) FRONTEND="React (Vite)" ;;
  4) FRONTEND="Vue" ;;
  5) FRONTEND="Svelte" ;;
  6) FRONTEND="None" ;;
  *) FRONTEND="Next.js" ;;
esac

echo ""
echo -e "  ${YELLOW}Backend technology:${NC}"
echo "    1) Node/Express"
echo "    2) Python/FastAPI"
echo "    3) PocketBase"
echo "    4) Supabase"
echo "    5) Go"
echo "    6) Rust"
echo "    7) None (no backend)"
read -rp "  Select [1-7] (default: 1): " BE_NUM
case "$BE_NUM" in
  1) BACKEND="Node/Express" ;;
  2) BACKEND="Python/FastAPI" ;;
  3) BACKEND="PocketBase" ;;
  4) BACKEND="Supabase" ;;
  5) BACKEND="Go" ;;
  6) BACKEND="Rust" ;;
  7) BACKEND="None" ;;
  *) BACKEND="Node/Express" ;;
esac

echo ""
echo -e "  ${YELLOW}Database:${NC}"
echo "    1) PostgreSQL"
echo "    2) SQLite"
echo "    3) MongoDB"
echo "    4) None (no database)"
read -rp "  Select [1-4] (default: 1): " DB_NUM
case "$DB_NUM" in
  1) DATABASE="PostgreSQL" ;;
  2) DATABASE="SQLite" ;;
  3) DATABASE="MongoDB" ;;
  4) DATABASE="None" ;;
  *) DATABASE="PostgreSQL" ;;
esac

echo ""
echo -e "  ${YELLOW}Deploy platform:${NC}"
echo "    1) Docker"
echo "    2) Vercel"
echo "    3) Coolify"
echo "    4) Railway"
echo "    5) Manual"
read -rp "  Select [1-5] (default: 1): " DEP_NUM
case "$DEP_NUM" in
  1) DEPLOY="Docker" ;;
  2) DEPLOY="Vercel" ;;
  3) DEPLOY="Coolify" ;;
  4) DEPLOY="Railway" ;;
  5) DEPLOY="Manual" ;;
  *) DEPLOY="Docker" ;;
esac

# ── Design System ──
echo ""
echo -e "${GREEN}🎨 Design System${NC}"

if [ "$FRONTEND" != "None" ]; then
  echo -e "  ${YELLOW}Do you want a DESIGN.md (visual design tokens)?${NC}"
  echo "    1) Yes — use a reference design system"
  echo "    2) Yes — start from scratch"
  echo "    3) No — skip (add later)"
  read -rp "  Select [1-3] (default: 1): " DS_NUM
  case "$DS_NUM" in
    1) DESIGN_SYSTEM="reference" ;;
    2) DESIGN_SYSTEM="scratch" ;;
    3) DESIGN_SYSTEM="skip" ;;
    *) DESIGN_SYSTEM="reference" ;;
  esac

  if [ "$DESIGN_SYSTEM" = "reference" ]; then
    echo ""
    echo -e "  ${YELLOW}Choose a reference design system:${NC}"
    echo "    1)  Material (Google)"
    echo "    2)  Apple (iOS)"
    echo "    3)  Ant Design"
    echo "    4)  Shadcn"
    echo "    5)  Tailwind"
    echo "    6)  Vercel"
    echo "    7)  Linear"
    echo "    8)  Notion"
    echo "    9)  Spotify"
    echo "    10) Custom (you'll define later)"
    read -rp "  Select [1-10] (default: 1): " REF_NUM
    case "$REF_NUM" in
      1) REFERENCE_DESIGN="material" ;;
      2) REFERENCE_DESIGN="apple" ;;
      3) REFERENCE_DESIGN="ant" ;;
      4) REFERENCE_DESIGN="shadcn" ;;
      5) REFERENCE_DESIGN="tailwind" ;;
      6) REFERENCE_DESIGN="vercel" ;;
      7) REFERENCE_DESIGN="linear" ;;
      8) REFERENCE_DESIGN="notion" ;;
      9) REFERENCE_DESIGN="spotify" ;;
      10) REFERENCE_DESIGN="custom" ;;
      *) REFERENCE_DESIGN="material" ;;
    esac
  fi
else
  DESIGN_SYSTEM="skip"
  REFERENCE_DESIGN="none"
fi

echo ""
echo -e "${GREEN}📐 Coding Standards${NC}"
echo -e "  ${YELLOW}Include CODING_STANDARDS.md?${NC}"
echo "    1) Yes — full standards"
echo "    2) Minimal — just naming conventions"
echo "    3) No — use AGENTS.md only"
read -rp "  Select [1-3] (default: 1): " CS_NUM
case "$CS_NUM" in
  1) CODING_STANDARDS="full" ;;
  2) CODING_STANDARDS="minimal" ;;
  3) CODING_STANDARDS="skip" ;;
  *) CODING_STANDARDS="full" ;;
esac

# ── Generate variables ──
ARCHITECT_NAME="${PROJECT_NAME}-architect"
STACK_SUMMARY="${FRONTEND} + ${BACKEND} + ${DATABASE}"
DATE=$(date +%Y-%m-%d)

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}⚙️  Configuring project...${NC}"

# ── 1. Install npm dependencies (husky + commitlint) ──
echo -e "  ${YELLOW}→ Installing npm dependencies (husky, commitlint)...${NC}"
if command -v npm &> /dev/null; then
  npm install 2>/dev/null && echo -e "  ${GREEN}✓ npm install complete${NC}" || echo -e "  ${YELLOW}⚠ npm install skipped (run manually later)${NC}"
else
  echo -e "  ${YELLOW}⚠ npm not found. Run 'npm install' manually after setup.${NC}"
fi

# ── 2. Setup git hooks ──
echo -e "  ${YELLOW}→ Setting up git hooks...${NC}"
if [ -d ".git" ] && command -v npx &> /dev/null; then
  npx husky 2>/dev/null && echo -e "  ${GREEN}✓ Git hooks installed${NC}" || echo -e "  ${YELLOW}⚠ Husky setup skipped${NC}"
else
  echo -e "  ${YELLOW}⚠ No git repo or npx. Run 'npx husky' manually after setup.${NC}"
fi

# ── 3. Update AGENTS.md ──
echo -e "  ${YELLOW}→ Updating AGENTS.md...${NC}"
if [ -f "AGENTS.md" ]; then
  sed -i "s/\[PROJECT_NAME\]/${PROJECT_NAME}/g" AGENTS.md
  sed -i "s/\[ONE_LINE_DESCRIPTION\]/${PROJECT_DESC}/g" AGENTS.md
  sed -i "s/\[STACK_TECH\]/${STACK_SUMMARY}/g" AGENTS.md
  sed -i "s/\[DATE\]/${DATE}/g" AGENTS.md
  echo -e "  ${GREEN}✓ AGENTS.md configured${NC}"
fi

# ── 4. Update CLAUDE.md ──
echo -e "  ${YELLOW}→ Updating CLAUDE.md...${NC}"
if [ -f "CLAUDE.md" ]; then
  sed -i "s/\[PROJECT_NAME\]/${PROJECT_NAME}/g" CLAUDE.md
  sed -i "s/\[ONE_LINE_DESCRIPTION\]/${PROJECT_DESC}/g" CLAUDE.md
  sed -i "s/\[STACK_TECH\]/${STACK_SUMMARY}/g" CLAUDE.md
  echo -e "  ${GREEN}✓ CLAUDE.md configured${NC}"
fi

# ── 5. Rename architect files ──
echo -e "  ${YELLOW}→ Renaming architect agents...${NC}"

# OpenCode
if [ -f ".opencode/agents/project-architect.md" ]; then
  mv ".opencode/agents/project-architect.md" ".opencode/agents/${ARCHITECT_NAME}.md"
  sed -i "s/^name: project-architect/name: ${ARCHITECT_NAME}/" ".opencode/agents/${ARCHITECT_NAME}.md" 2>/dev/null || true
  echo -e "  ${GREEN}✓ OpenCode: project-architect.md → ${ARCHITECT_NAME}.md${NC}"
fi

# Claude Code — architect is in CLAUDE.md, not a separate file
# Just update the architect name reference in CLAUDE.md
if [ -f "CLAUDE.md" ]; then
  sed -i "s/Project Architect/${ARCHITECT_NAME}/g" CLAUDE.md 2>/dev/null || true
  echo -e "  ${GREEN}✓ Claude Code: architect name updated in CLAUDE.md${NC}"
fi

# ── 6. Configure agents for stack ──
echo -e "  ${YELLOW}→ Configuring agents for stack...${NC}"

if [ "$FRONTEND" = "None" ]; then
  rm -f ".opencode/agents/frontend-developer.md" ".claude/agents/frontend-developer.md" 2>/dev/null
  echo -e "  ${GREEN}✓ Removed frontend-developer (no frontend)${NC}"
fi

if [ "$BACKEND" = "None" ]; then
  rm -f ".opencode/agents/backend-developer.md" ".claude/agents/backend-developer.md" 2>/dev/null
  echo -e "  ${GREEN}✓ Removed backend-developer (no backend)${NC}"
fi

# ── 7. Update README.md ──
echo -e "  ${YELLOW}→ Updating README.md...${NC}"
if [ -f "README.md" ]; then
  sed -i "s/\[PROJECT_NAME\]/${PROJECT_NAME}/g" README.md
  sed -i "s/\[ONE_LINE_DESCRIPTION\]/${PROJECT_DESC}/g" README.md
  sed -i "s/\[STACK_TECH\]/${STACK_SUMMARY}/g" README.md
  echo -e "  ${GREEN}✓ README.md configured${NC}"
fi

# ── 8. Update Makefile ──
echo -e "  ${YELLOW}→ Updating Makefile...${NC}"
if [ -f "Makefile" ]; then
  sed -i "s/\[PROJECT_NAME\]/${PROJECT_NAME}/g" Makefile
  echo -e "  ${GREEN}✓ Makefile configured${NC}"
fi

# ── 9. Generate prompt.md for agent ──
echo -e "  ${YELLOW}→ Generating prompt.md for agent...${NC}"
cat > prompt.md << EOF
# Project Configuration — Generated by init.sh

## Project Identity
- **Name:** ${PROJECT_NAME}
- **Description:** ${PROJECT_DESC}
- **Type:** ${PROJECT_TYPE}
- **UI Language:** ${UI_LANG}
- **Date:** ${DATE}

## Stack
- **Frontend:** ${FRONTEND}
- **Backend:** ${BACKEND}
- **Database:** ${DATABASE}
- **Deploy:** ${DEPLOY}
- **Stack Summary:** ${STACK_SUMMARY}

## Agent Configuration
- **Architect Name:** ${ARCHITECT_NAME}

---

## Instructions for Agent

Read this file and execute the following steps:

1. **Update architect name in agent files:**
   - Update references to "project-architect" in AGENTS.md and CLAUDE.md
   - Update the routing table in both files

2. **Decide folder structure:**
   - Based on project type and stack, create the appropriate directories
   - Remove unnecessary ones

3. **Update docs templates:**
   - Fill placeholders in docs/architecture/system_overview.md
   - Fill placeholders in docs/architecture/deployment.md
   - Update docs/legal/privacy_policy.md

4. **Delete this file** (\`prompt.md\`) when configuration is complete.

After completing these steps, confirm to the user that the project is ready.
EOF

echo -e "  ${GREEN}✓ prompt.md generated${NC}"

# ── 10. Copy DESIGN.md template ──
if [ "$DESIGN_SYSTEM" != "skip" ] && [ -f "DESIGN.md.template" ]; then
  cp "DESIGN.md.template" "DESIGN.md"
  sed -i "s/\[PROJECT_NAME\]/${PROJECT_NAME}/g" DESIGN.md
  sed -i "s/\[DESCRIBE THE VISUAL IDENTITY.*/${REFERENCE_DESIGN} design system reference/g" DESIGN.md
  echo -e "  ${GREEN}✓ DESIGN.md created (reference: ${REFERENCE_DESIGN})${NC}"
  echo -e "  ${YELLOW}  → Edit DESIGN.md to match your brand${NC}"
fi

# ── 11. Copy CODING_STANDARDS.md template ──
if [ "$CODING_STANDARDS" != "skip" ] && [ -f "CODING_STANDARDS.md.template" ]; then
  cp "CODING_STANDARDS.md.template" "CODING_STANDARDS.md"
  sed -i "s/\[PROJECT_NAME\]/${PROJECT_NAME}/g" CODING_STANDARDS.md
  sed -i "s/\[STACK_TECH\]/${STACK_SUMMARY}/g" CODING_STANDARDS.md
  sed -i "s/\[DATE\]/${DATE}/g" CODING_STANDARDS.md
  echo -e "  ${GREEN}✓ CODING_STANDARDS.md created (${CODING_STANDARDS})${NC}"
fi

# ── 12. Update .gitignore for templates ──
echo "" >> .gitignore
echo "# Templates (not tracked)" >> .gitignore
echo "*.template" >> .gitignore

# ── Summary ──
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo -e "  ${YELLOW}What was configured:${NC}"
echo "    ✓ npm dependencies (husky, commitlint)"
echo "    ✓ Git hooks (pre-commit, commit-msg)"
echo "    ✓ AGENTS.md (placeholders filled)"
echo "    ✓ CLAUDE.md (placeholders filled)"
echo "    ✓ Architect agents renamed"
echo "    ✓ Stack-specific agents configured"
echo "    ✓ README.md (placeholders filled)"
echo "    ✓ Makefile (project name)"
echo "    ✓ prompt.md (for agent to finish setup)"
if [ "$DESIGN_SYSTEM" != "skip" ]; then
  echo "    ✓ DESIGN.md (visual tokens: ${REFERENCE_DESIGN})"
fi
if [ "$CODING_STANDARDS" != "skip" ]; then
  echo "    ✓ CODING_STANDARDS.md (${CODING_STANDARDS})"
fi
echo ""
echo -e "  ${YELLOW}Next steps:${NC}"
echo "    1. Open in OpenCode or Claude Code"
echo "    2. The agent will read prompt.md and finish configuration"
echo "    3. Run 'make help' to see available commands"
echo ""
