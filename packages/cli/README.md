# @agentkit/cli

> **Migration Note:** This package was formerly `@coding-agent-fabric/cli`. See [Migration Guide](../../docs/migration-from-caf.md).

Command-line interface for **AgentKit** - universal control plane for coding agents.

## Installation

Install the CLI globally:

```bash
npm install -g @agentkit/cli
```

Or run it directly without installation using `npx`:

```bash
npx @agentkit/cli <command>
```

## Usage

```bash
# Install resources
agentkit add owner/repo --type skill
agentkit add ./my-skills --type rule

# List installed resources
agentkit list --type skill
agentkit list --type rule
agentkit list --type subagent

# Remove a resource
agentkit remove my-skill
agentkit plugin remove my-plugin-id

# Check installation health
agentkit doctor

# Update all resources
agentkit update

# Legacy compatibility (deprecated):
# caf skills add owner/repo
```

## Commands

### Unified Resource Management (v0.2+)

- `agentkit add <source> [--type skill|rule|subagent]` - Install a resource
- `agentkit list [--type <type>]` - List installed resources
- `agentkit remove <name>` - Remove a resource
- `agentkit update` - Update all resources

### Initialization & Sync

- `agentkit init` - Auto-detect agents and scaffold directories
- `agentkit sync [--agent <agent>]` - Sync resources to agent directories

### MCP Discovery (v0.2+)

- `agentkit mcp serve` - Start MCP discovery server for runtime resource querying

### Project Setup (v0.2+)

- `agentkit primer` - Generate project instructions (CLAUDE.md, etc.)

### Plugins

- `agentkit plugin add <source>` - Install a third-party plugin
- `agentkit plugin list` - List installed plugins
- `agentkit plugin remove <id>` - Remove a plugin

### System

- `agentkit doctor` - Check installation health and detected agents
- `agentkit update` - Update all resources to latest versions

### Legacy Commands (Deprecated)

For backward compatibility, these commands still work but print deprecation warnings:

- `agentkit skills <add|list|remove|update>` → Use `agentkit add/list/remove --type skill`
- `agentkit rules <add|list|remove|update>` → Use `agentkit add/list/remove --type rule`
- `agentkit subagents <add|list|remove|update>` → Use `agentkit add/list/remove --type subagent`

## Global Options

- `-V, --version` - Output the version number
- `-h, --help` - Display help for command

## Command Options

### `add` command options

- `-g, --global` - Install to global configuration
- `-f, --force` - Force reinstall if the resource already exists
- `-y, --yes` - Skip confirmation prompts (non-interactive mode)
- `--agent <agent>` - Target a specific agent (e.g., `claude-code`, `cursor`)
- `--mode <mode>` - Installation mode: `copy` or `symlink` (default: `copy`)

### `list` command options

- `-g, --global` - List global resources only
- `-p, --project` - List project-specific resources only
- `-a, --all` - List all resources (default)

### `remove` command options

- `-g, --global` - Remove from global scope
- `-f, --force` - Force removal even if the resource is not found
- `-y, --yes` - Skip confirmation prompts

### `update` command options

- `--check-only` - Only check for updates without installing
