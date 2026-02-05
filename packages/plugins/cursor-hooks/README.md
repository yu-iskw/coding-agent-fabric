# @coding-agent-fabric/plugin-cursor-hooks

Plugin for managing Cursor IDE hooks.

## Overview

This plugin enables installation and management of hooks for Cursor IDE, which execute shell commands in response to IDE events.

## Supported Agents

- `cursor`

## Hook Types

Cursor supports various hook types:

- `onSave`: Executed when a file is saved
- `onCommit`: Executed before a git commit
- `onFileOpen`: Executed when a file is opened
- `onProjectOpen`: Executed when a project is opened

## Hook Configuration Format

Hooks are defined in JSON format:

```json
{
  "hookType": "onSave",
  "filePattern": "**/*.ts",
  "command": "trunk fmt ${FILE_PATH}",
  "description": "Auto-format TypeScript files on save"
}
```

### Fields

- `hookType` (required): The event type that triggers this hook
- `command` (required): Shell command to execute
- `filePattern` (optional): Glob pattern for files this hook applies to
- `description` (optional): Human-readable description

## Installation Paths

- **Global**: `~/.cursor/hooks/`
- **Project**: `./.cursor/hooks/`

## Usage

```bash
# Install a hook
caf install local:./path/to/hooks --type cursor-hooks --agent cursor

# List installed hooks
caf list --type cursor-hooks

# Remove a hook
caf remove hook-name --type cursor-hooks
```

## Example Hooks

### Auto-format on Save

```json
{
  "hookType": "onSave",
  "filePattern": "**/*.{ts,tsx,js,jsx}",
  "command": "trunk fmt ${FILE_PATH}",
  "description": "Auto-format JavaScript/TypeScript files on save"
}
```

### Lint on Commit

```json
{
  "hookType": "onCommit",
  "command": "trunk check --fix",
  "description": "Run linter before commits"
}
```

### Welcome Message

```json
{
  "hookType": "onProjectOpen",
  "command": "echo 'Welcome to the project!'",
  "description": "Display welcome message when project opens"
}
```
