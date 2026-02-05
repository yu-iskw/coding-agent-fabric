# Claude Code Configuration Guide

## Directory Structure

```text
.claude/
├── settings.json          # Hooks, permissions, environment
├── settings.local.json    # Personal overrides (gitignored)
├── agents/                # Specialized subagents
│   ├── verifier.md       # Build/lint/test verification
│   └── code-reviewer.md  # Code quality review
├── skills/               # Reusable workflows and knowledge
│   ├── <skill>/SKILL.md  # Skill definition
│   └── common-references/ # Shared documentation
└── hooks/                # Hook scripts
    └── *.sh              # Executable hook scripts
```

## Key Files

### CLAUDE.md (Project Root)

Project memory that loads at session start. Contains:

- Quick commands
- Code style conventions
- Testing workflow
- Architecture decisions
- Common gotchas

**Best Practice**: Keep under 150 lines. Move detailed content to skills.

### .claude/settings.json

Configuration for hooks, permissions, and environment:

```json
{
  "permissions": {
    "allow": ["Bash(pnpm *)"],
    "deny": ["Bash(rm -rf /)"]
  },
  "hooks": {
    "PreToolUse": [...],
    "PostToolUse": [...]
  },
  "env": {
    "VAR": "value"
  }
}
```

## Available Skills

| Skill                        | Invoke With                     | Purpose                        |
| ---------------------------- | ------------------------------- | ------------------------------ |
| initialize-project           | `/initialize-project`           | Bootstrap from template        |
| setup-dev-env                | `/setup-dev-env`                | Set up development environment |
| lint-and-fix                 | `/lint-and-fix`                 | Auto-fix linting issues        |
| test-and-fix                 | `/test-and-fix`                 | Fix failing tests              |
| build-and-fix                | `/build-and-fix`                | Fix build errors               |
| clean-project                | `/clean-project`                | Hard reset environment         |
| node-upgrade                 | `/node-upgrade`                 | Upgrade dependencies           |
| security-vulnerability-audit | `/security-vulnerability-audit` | Security scanning              |
| improve-claude-config        | `/improve-claude-config`        | Self-improvement               |
| fix-issue                    | `/fix-issue <number>`           | Fix GitHub issues              |

## Available Agents

| Agent         | Description                      | Tools                  |
| ------------- | -------------------------------- | ---------------------- |
| verifier      | Run build → lint → test cycle    | All                    |
| code-reviewer | Review code quality and security | Read, Grep, Glob, Bash |

## Hook Events

| Event        | When Fired                   |
| ------------ | ---------------------------- |
| PreToolUse   | Before a tool executes       |
| PostToolUse  | After a tool completes       |
| SessionStart | When Claude Code starts      |
| SessionEnd   | When session ends            |
| Stop         | When Claude stops responding |

## Self-Improvement Workflow

1. **Notice a pattern**: Claude makes the same mistake repeatedly
2. **Invoke skill**: Use `/improve-claude-config`
3. **Choose action**:
   - Add rule to CLAUDE.md
   - Create new skill
   - Add hook for automation
   - Create specialized agent
4. **Commit changes**: Version control your improvements
