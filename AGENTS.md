# Agent Guidelines — study-web Project

> [!NOTE]
> This project uses **global agent rules** managed in `~/.gemini/config/plugins/`.
> The full rule definitions live there. This file only records project-specific overrides and quick references.

## Active Global Rules (via plugins)

| Rule | Global Plugin | Description |
|---|---|---|
| Requirements Elicitation | `coding-standards` | Always interrogate requirements before coding |
| Plan-and-Execute | `coding-standards` / `plan-and-execute` | Two-tier plan + external memory + intent gate |
| Git Workflow | `coding-standards` | Conventional Commits, branch naming, PR lifecycle |
| Coding Standards | `coding-standards` | Karpathy simplicity & surgical changes guidelines |

## Project-Specific Overrides

### Git Scope Convention (Monorepo)
This project uses three modules:
- `be` → `MODULE_BE/` (NestJS + Prisma + PostgreSQL)
- `fe` → `MODULE_FE/` (React 19 + Vite + Tailwind + shadcn)
- `admin` → `MODULE_ADMIN/` (React admin panel)

### Skills Available
- `.agents/skills/requirements-elicitation/` — Socratic interrogation skill
- `.agents/skills/plan-and-execute/` — Plan-and-execute skill
- `.agents/skills/ui-ux-pro-max/` — UI/UX design skill
- `.agents/skills/docs-as-code/` — Documentation-as-code skill
