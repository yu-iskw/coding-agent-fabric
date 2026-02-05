# Claude Code Configuration

This directory contains the Claude Code configuration for AI-assisted development.

## Structure

```text
.claude/
├── README.md              # This file
├── settings.json          # Hooks, permissions, and environment
├── agents/                # Specialized subagents
│   ├── verifier.md       # Build/lint/test verification
│   ├── code-reviewer.md  # Code quality and security review
│   ├── parallel-executor.md      # Orchestrates parallel task execution
│   ├── parallel-tasks-planner.md # Plans task decomposition
│   └── task-worker.md    # Executes isolated subtasks
├── skills/               # Reusable workflows and knowledge
│   ├── build-and-fix/    # Auto-fix build errors
│   ├── clean-project/    # Hard reset environment
│   ├── common-references/ # Shared documentation
│   ├── fix-issue/        # GitHub issue workflow
│   ├── improve-claude-config/ # Self-improvement skill
│   ├── initialize-project/ # Template bootstrapping
│   ├── lint-and-fix/     # Auto-fix linting issues
│   ├── manage-adr/       # ADR management
│   ├── manage-changelog/ # Changelog management
│   ├── node-upgrade/     # Dependency upgrades
│   ├── security-vulnerability-audit/ # Security scanning
│   ├── setup-dev-env/    # Environment setup
│   └── test-and-fix/     # Auto-fix failing tests
└── hooks/                # Hook scripts
    ├── block-dangerous.sh # Block dangerous commands
    ├── format-ts.sh       # Auto-format TS files
    └── validate-commit.sh # Validate commit messages
```

## Quick Start

### Using Skills

Invoke skills with slash commands:

```bash
/setup-dev-env          # Set up your development environment
/lint-and-fix           # Fix all linting issues
/test-and-fix           # Fix failing tests
/fix-issue 123          # Fix GitHub issue #123
/parallel-executor <task> # Execute complex tasks in parallel
```

### Using Agents

Agents are specialized assistants invoked via the Task tool:

| Agent                      | Purpose                                     |
| -------------------------- | ------------------------------------------- |
| **verifier**               | Runs build → lint → test cycle              |
| **code-reviewer**          | Reviews code for quality and security       |
| **parallel-executor**      | Orchestrates parallel task execution        |
| **parallel-tasks-planner** | Creates execution plans with file ownership |
| **task-worker**            | Executes isolated subtasks with constraints |

### Parallel Execution

For large tasks that can benefit from concurrent work:

```bash
/parallel-executor Add comprehensive logging to all modules
```

**Architecture:**

```text
/parallel-executor "task description"
        │
        ▼
┌───────────────────────┐
│  parallel-executor    │  ← Orchestrator agent
│       agent           │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│ parallel-tasks-planner│  ← Creates execution plan
│       agent           │
└───────────┬───────────┘
            │
            ▼ (YAML plan with phases & file ownership)
            │
┌───────────┴───────────┐
│   Phase Execution     │
│                       │
│  Phase 1 (Parallel):  │
│  ┌─────┐  ┌─────┐    │
│  │ W1  │  │ W2  │    │  ← task-worker agents
│  └─────┘  └─────┘    │
│                       │
│  Phase 2 (Sequential):│
│  ┌──────────────┐    │
│  │     W3       │    │
│  └──────────────┘    │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│   verifier agent      │  ← Verification
└───────────────────────┐
```

### Self-Improvement

This configuration supports self-evolution. Use `/improve-claude-config` when:

- Claude makes repeated mistakes
- You want to automate a recurring workflow
- New conventions should be documented

## Configuration Files

### settings.json

Contains:

- **permissions**: Allowed and denied commands
- **hooks**: Automatic triggers for tool events

### CLAUDE.md (in project root)

Project memory loaded at session start. Contains:

- Quick commands reference
- Code style conventions
- Testing workflow
- Common gotchas

## Best Practices

1. **Keep CLAUDE.md concise**: Under 100 lines, move details to skills
2. **Use specific skills**: Don't duplicate knowledge across skills
3. **Test hooks**: Validate hook scripts work before committing
4. **Version control**: Commit configuration changes with clear messages
5. **Self-improve**: Add rules when Claude makes repeated mistakes

## Customization

### Adding a New Skill

1. Create directory: `.claude/skills/<skill-name>/`
2. Create `SKILL.md` with YAML frontmatter and markdown content
3. Invoke with `/<skill-name>`

### Adding a New Hook

1. Create script in `.claude/hooks/`
2. Make executable: `chmod +x .claude/hooks/<script>.sh`
3. Register in `.claude/settings.json` under appropriate event

### Adding a New Agent

1. Create `.claude/agents/<agent-name>.md`
2. Define name, description, tools, and model in frontmatter
3. Write agent instructions in markdown body
