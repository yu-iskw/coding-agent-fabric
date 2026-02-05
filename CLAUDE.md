# TypeScript Monorepo - Claude Code Memory

## Project Overview

This is a production-ready TypeScript monorepo template using modern tooling:

- **Package Manager**: pnpm (with workspace support)
- **Runtime**: Node.js (see `.node-version` for current version)
- **Build System**: tsc / pnpm
- **Linting/Formatting**: Trunk (manages ESLint, Prettier, and more)
- **Testing**: Vitest
- **CI/CD**: GitHub Actions

## Quick Commands

```bash
pnpm install    # Install all dependencies
pnpm build      # Build all packages
pnpm test       # Run all tests via Vitest
pnpm lint       # Run all linters via Trunk
pnpm format     # Auto-format code via Trunk
pnpm clean      # Clean build artifacts
```

## Code Style

- Use TypeScript for all code
- Follow project ESLint/Prettier configuration (managed via Trunk)
- Use functional programming patterns where appropriate
- Use `PascalCase` for classes/interfaces, `camelCase` for functions/variables
- Use `kebab-case` for file names (e.g., `user-service.ts`)

## Testing

- Write tests in `tests/` or alongside source files as `*.test.ts`
- Use Vitest for unit and integration tests
- Aim for high test coverage on core logic
- Run `pnpm test` before committing

## Git Workflow

- Create feature branches from `main`
- Run `pnpm lint && pnpm test` before commits
- Commit messages: `type(scope): description` (e.g., `feat(ui): add new button component`)
- Types: feat, fix, docs, style, refactor, test, chore
- Record changes using the `manage-changelog` skill when `changie` is available

## Architecture

- Source code in `packages/*` or `src/` (depending on package structure)
- Development scripts and shared config in root
- CI/CD workflows in `.github/workflows/`
- Claude Code configuration in `.claude/`
- Document significant design decisions as Architecture Decision Records (ADRs) in `docs/adr`; use the `manage-adr` skill when `adr` is available

## Common Gotchas

- Always use `pnpm` instead of `npm` or `yarn`
- Trunk manages tool versions hermetically - don't install linters globally
- The `pnpm-lock.yaml` file is committed for reproducibility - don't gitignore it
- Run `trunk install` if linters report missing tools

## Parallel Task Execution

For large tasks that can benefit from concurrent work:

```bash
/parallel-executor Add comprehensive logging to all modules
```

This decomposes tasks into independent subtasks with file ownership, executes them in parallel, and verifies results.

## Available Agents

| Agent                    | Purpose                              |
| ------------------------ | ------------------------------------ |
| `verifier`               | Run build → lint → test cycle        |
| `code-reviewer`          | Review code for quality and security |
| `parallel-executor`      | Orchestrate parallel task execution  |
| `parallel-tasks-planner` | Plan task decomposition              |
| `task-worker`            | Execute isolated subtasks            |

## Available Skills

| Skill                          | Purpose                                                                                        |
| :----------------------------- | :--------------------------------------------------------------------------------------------- |
| `build-and-fix`                | Build the project and automatically fix build errors, compilation failures, or type mismatches |
| `clean-project`                | Perform a "hard reset" of the development environment (clean node_modules, lockfiles, etc.)    |
| `fix-issue`                    | Fix a GitHub issue end-to-end (view, branch, fix, test, PR)                                    |
| `improve-claude-config`        | Self-improvement skill for evolving Claude Code configuration                                  |
| `initialize-project`           | Initialize a new project from the template (rename packages, update metadata)                  |
| `lint-and-fix`                 | Run linters and fix violations, formatting errors, or style mismatches using Trunk             |
| `manage-adr`                   | Manage Architecture Decision Records (init, create, list, link ADRs in `docs/adr`)             |
| `manage-changelog`             | Manage changelogs with Changie (init, add fragments, batch releases, merge into CHANGELOG.md)  |
| `node-upgrade`                 | Safely upgrade Node.js dependencies in pnpm workspaces                                         |
| `security-vulnerability-audit` | Audit security vulnerabilities using Trunk (Trivy and OSV-scanner)                             |
| `setup-dev-env`                | Set up the development environment (Node.js, pnpm, Trunk)                                      |
| `test-and-fix`                 | Run unit tests and automatically fix failures, regression bugs, or test mismatches             |
| `problem-solving`              | Systematic issue analysis and report generation (global skill)                                 |

## Configuration Self-Improvement

This project supports Claude Code self-improvement. When you notice repeated mistakes, recurring explanations, or opportunities for automation:

1. **Analyze Pattern**: Identify if it's a rule (guidance), a hook (mandatory action), a skill (workflow), or an agent (specialized task).
2. **Implement Improvement**:
   - **Rules**: Add to `CLAUDE.md` or `.cursor/rules/` for guidance requiring judgment.
   - **Hooks**: Use `PreToolUse` or `PostToolUse` in `.claude/settings.json` for deterministic, mandatory checks.
   - **Skills**: Create new entries in `.claude/skills/` for reusable complex workflows.
   - **Agents**: Define new agents in `.claude/agents/` for specialized context isolation.
3. **Use Subagents**: For configuration research or verification, use subagents to isolate context and prevent contamination of the main session.
4. **Be Specific & Minimal**: Only add rules or skills that provide clear, non-obvious value.

Use the `/improve-claude-config` skill to orchestrate these changes.

## Recent Learnings

- [2026-02-05]: Initial setup of the comprehensive skills reference and self-improvement guidelines.
