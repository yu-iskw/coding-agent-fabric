# coding-agent-fabric

`coding-agent-fabric` is a universal CLI for managing AI coding-agent resources across multiple agents and platforms. It provides a unified way to discover, install, and manage skills, subagents, and other extensions.

## Installation

You can install the CLI globally:

```bash
npm install -g @coding-agent-fabric/cli
```

Or run it directly without installation using `npx`:

```bash
npx @coding-agent-fabric/cli <command>
```

## Core Resources

- **Skills**: Modular instructions and capabilities (e.g., `.md` or `.mdc` files) that enhance agent behavior.
- **Subagents**: Specialized agent definitions (e.g., YAML or JSON) that can be invoked for specific tasks.

## Supported Agents

The fabric automatically detects and manages resources for:

- **Claude Code** (`.claude/`)
- **Cursor** (`.cursor/rules/`)
- **Gemini CLI (Codex)** (`.codex/`)

## CLI Examples

<!-- SYNC:COMMANDS -->

### Rules

Manage AI agent rules

```bash
# Install rules from a source
caf rules add owner/repo
# List installed rules
caf rules list
# Remove a rule
caf rules remove rule-name
# Update all rules
caf rules update
```

### Skills

Manage AI agent skills

```bash
# Install skills from a source
caf skills add owner/repo
# List installed skills
caf skills list
# Remove a skill
caf skills remove skill-name
# Update all skills
caf skills update
```

### Subagents

Manage AI subagents

```bash
# Install subagents from a source
caf subagents add owner/repo
# List installed subagents
caf subagents list
# Remove a subagent
caf subagents remove subagent-name
# Update all subagents
caf subagents update
```

### Plugins

Manage coding-agent-fabric plugins

```bash
# Install a third-party plugin
caf plugin add owner/repo
# List installed plugins
caf plugin list
# Remove a plugin
caf plugin remove plugin-id
```

### System

System management commands

```bash
# Check the health of your installation
caf doctor
# Check for updates across all resources
caf check
# Update all resources to their latest versions
caf update
```

<!-- /SYNC:COMMANDS -->

## Packages

The following packages are part of the `coding-agent-fabric` ecosystem:

| Package                                                                               | Description                      |
| :------------------------------------------------------------------------------------ | :------------------------------- |
| [`@coding-agent-fabric/cli`](packages/cli)                                            | Command-line interface           |
| [`@coding-agent-fabric/core`](packages/core)                                          | Core logic and agent registry    |
| [`@coding-agent-fabric/common`](packages/common)                                      | Shared types and utilities       |
| [`@coding-agent-fabric/plugin-api`](packages/plugin-api)                              | API for building plugins         |
| [`@coding-agent-fabric/plugin-claude-code-hooks`](packages/plugins/claude-code-hooks) | Plugin for Claude Code hooks     |
| [`@coding-agent-fabric/plugin-cursor-hooks`](packages/plugins/cursor-hooks)           | Plugin for Cursor hooks          |
| [`@coding-agent-fabric/plugin-mcp`](packages/plugins/mcp)                             | Plugin for MCP server management |

## Roadmap

- [x] **Hooks Plugin**: Manage agent-specific hooks (Pre/Post tool use).
- [x] **MCP Plugin**: Manage Model Context Protocol (MCP) server configurations.
- [ ] **Remote Plugin Installation**: Install plugins directly from npm or GitHub.
- [ ] **Auto-Updates**: Check for and install updates for managed resources.
- [ ] **Registry**: A central repository for sharing skills and subagents.

## Contributing

Interested in contributing? Please read our [CONTRIBUTING.md](CONTRIBUTING.md) guide to set up your development environment.

## License

Apache License 2.0
