# AgentKit

> **Note:** This project was formerly known as `coding-agent-fabric`. See [Migration Guide](docs/migration-from-caf.md) for upgrading from `caf` to `agentkit`.

**AgentKit** is a universal control plane for coding agents. It provides a unified way to discover, install, and manage portable skills, rules, subagents, and agent resources across multiple AI coding platforms.

## Installation

Install the CLI globally:

```bash
npm install -g @agentkit/cli
```

Or run it directly without installation using `npx`:

```bash
npx @agentkit/cli <command>
```

**Migrating from `coding-agent-fabric`?** The old `@coding-agent-fabric/cli` package is deprecated. Install `@agentkit/cli` instead. The `caf` command will continue to work with deprecation warnings.

## Core Resources

- **Skills**: Modular instructions and capabilities (e.g., `.md` or `.mdc` files) that enhance agent behavior.
- **Subagents**: Specialized agent definitions (e.g., YAML or JSON) that can be invoked for specific tasks.

## Key Features

- **🎯 Portable Resources**: Write skills once, deploy across multiple agents
- **🔄 Automatic Sync**: Canonical source-of-truth with agent-specific rendering
- **🔌 Plugin Ecosystem**: Extend with agent-specific hooks and MCP server management
- **🔍 Runtime Discovery**: MCP server for dynamic resource querying
- **📦 Package Management**: Install from Git, npm, or registries

## Supported Agents

AgentKit automatically detects and manages resources for:

- **Claude Code** (`.claude/`)
- **Cursor** (`.cursor/rules/`)
- **Gemini CLI (Codex)** (`.codex/`)

## CLI Examples

<!-- SYNC:COMMANDS -->

### Rules

Manage AI agent rules

```bash
# Install rules from a source
agentkit add owner/repo --type rule
# List installed rules
agentkit list --type rule
# Remove a rule
agentkit remove rule-name
# Update all rules
agentkit update

# Legacy compatibility (deprecated):
# caf rules add owner/repo
```

### Skills

Manage AI agent skills

```bash
# Install skills from a source
agentkit add owner/repo --type skill
# List installed skills
agentkit list --type skill
# Remove a skill
agentkit remove skill-name
# Update all skills
agentkit update

# Legacy compatibility (deprecated):
# caf skills add owner/repo
```

### Subagents

Manage AI subagents

```bash
# Install subagents from a source
agentkit add owner/repo --type subagent
# List installed subagents
agentkit list --type subagent
# Remove a subagent
agentkit remove subagent-name
# Update all subagents
agentkit update

# Legacy compatibility (deprecated):
# caf subagents add owner/repo
```

### Plugins

Manage coding-agent-fabric plugins

```bash
# Install a third-party plugin
agentkit plugin add owner/repo
# List installed plugins
agentkit plugin list
# Remove a plugin
agentkit plugin remove plugin-id
```

### System

System management commands

```bash
# Initialize AgentKit for your project
agentkit init
# Check the health of your installation
agentkit doctor
# Sync resources to agent directories
agentkit sync
# Update all resources to their latest versions
agentkit update
```

<!-- /SYNC:COMMANDS -->

## Packages

The following packages are part of the AgentKit ecosystem:

| Package                                        | Description                           | Status       |
| :--------------------------------------------- | :------------------------------------ | :----------- |
| [`@agentkit/cli`](packages/cli)                | Command-line interface                | ✅ Current   |
| [`@agentkit/core`](packages/core)              | Core logic and resource registry      | ✅ Current   |
| [`@agentkit/common`](packages/common)          | Shared types and utilities            | ✅ Current   |
| [`@agentkit/plugin-api`](packages/plugin-api)  | API for building plugins              | ✅ Current   |
| [`@agentkit/plugin-claude-hooks`](packages/plugins/claude-code-hooks) | Plugin for Claude Code hooks | ✅ Current   |
| [`@agentkit/plugin-cursor-hooks`](packages/plugins/cursor-hooks) | Plugin for Cursor hooks       | ✅ Current   |
| [`@agentkit/plugin-mcp`](packages/plugins/mcp) | Plugin for MCP server management      | ✅ Current   |
| `@agentkit/mcp-server`                         | MCP server for runtime discovery      | 🚧 Planned   |

### Legacy Packages (Deprecated)

The old `@coding-agent-fabric/*` packages are deprecated and will be removed in v1.0:
- `@coding-agent-fabric/cli` → Use `@agentkit/cli` instead
- `@coding-agent-fabric/core` → Use `@agentkit/core` instead
- All other packages similarly renamed

See [Migration Guide](docs/migration-from-caf.md) for details.

## Roadmap

### ✅ Completed
- [x] **Hooks Plugin**: Manage agent-specific hooks (Pre/Post tool use)
- [x] **MCP Plugin**: Manage Model Context Protocol (MCP) server configurations
- [x] **Multi-agent Support**: Claude Code, Cursor, Codex

### 🚧 In Progress (v0.2)
- [ ] **Canonical Resource Model**: Unified schema for skills/rules/subagents
- [ ] **Renderer Abstraction**: Translate resources to agent-specific formats
- [ ] **MCP Discovery Server**: Runtime resource querying via MCP
- [ ] **Primer Generator**: Auto-generate project instructions
- [ ] **Unified CLI**: `agentkit add/list/remove` commands

### 📋 Planned (v0.3+)
- [ ] **Resource Registry**: Central catalog for sharing skills
- [ ] **Marketplace**: Browse and install from curated collections
- [ ] **Resource Manifests**: Locked, reproducible team setups
- [ ] **CI/CD Integration**: Automated sync in CI pipelines
- [ ] **REST API**: Optional REST interface for external tooling

## Contributing

Interested in contributing? Please read our [CONTRIBUTING.md](CONTRIBUTING.md) guide to set up your development environment.

## License

Apache License 2.0
