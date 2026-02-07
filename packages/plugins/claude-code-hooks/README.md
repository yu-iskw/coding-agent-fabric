# @agentkit/plugin-claude-code-hooks

Plugin for managing Claude Code hooks (PreToolUse and PostToolUse).

## Overview

This plugin enables installation and management of hooks for Claude Code, which execute shell commands before or after tool usage.

## Supported Agents

- `claude-code`

## Hook Types

- **PreToolUse**: Executed before a tool is used
- **PostToolUse**: Executed after a tool is used

## Hook Configuration Format

Hooks are defined in JSON format:

```json
{
  "hookType": "PreToolUse",
  "tools": ["Edit", "Write"],
  "command": "echo 'About to edit a file'",
  "description": "Log before file edits"
}
```

### Fields

- `hookType` (required): Either `PreToolUse` or `PostToolUse`
- `command` (required): Shell command to execute
- `tools` (optional): Array of tool names to apply this hook to (empty = all tools)
- `description` (optional): Human-readable description

## Installation Paths

- **Global**: `~/.claude/hooks/`
- **Project**: `./.claude/hooks/`

## Usage

```bash
# Install a hook
caf install local:./path/to/hooks --type claude-code-hooks --agent claude-code

# List installed hooks
caf list --type claude-code-hooks

# Remove a hook
caf remove hook-name --type claude-code-hooks
```

## Example Hooks

### Pre-commit Hook

```json
{
  "hookType": "PreToolUse",
  "tools": ["Bash"],
  "command": "git diff --cached --name-only | grep -q . || exit 0",
  "description": "Verify staged changes before git operations"
}
```

### Auto-format on Write

```json
{
  "hookType": "PostToolUse",
  "tools": ["Write", "Edit"],
  "command": "trunk fmt ${FILE_PATH}",
  "description": "Auto-format files after writing"
}
```
