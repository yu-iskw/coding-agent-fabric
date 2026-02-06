# @coding-agent-fabric/cli

Command-line interface for coding-agent-fabric.

## Installation

You can install the CLI globally:

```bash
npm install -g @coding-agent-fabric/cli
```

Or run it directly without installation using `npx`:

```bash
npx @coding-agent-fabric/cli <command>
```

## Usage

```bash
# Install rules from a repository
caf rules add owner/repo

# Install skills from a local directory
caf skills add ./my-skills

# List installed resources
caf rules list
caf skills list
caf subagents list

# Remove a resource
caf rules remove my-rule
caf plugin remove my-plugin-id

# Check installation health
caf doctor

# Update all resources
caf update
```

## Commands

### Rules

Manage AI agent rules (e.g., `.cursorrules`, `.claude/rules`).

- `caf rules add <source>` - Install rules from a source (repository, local path, or npm)
- `caf rules list` - List installed rules
- `caf rules remove <name>` - Remove a rule
- `caf rules update` - Update all rules

### Skills

Manage AI agent skills.

- `caf skills add <source>` - Install skills from a source
- `caf skills list` - List installed skills
- `caf skills remove <name>` - Remove a skill
- `caf skills update` - Update all skills

### Subagents

Manage AI subagents.

- `caf subagents add <source>` - Install subagents from a source
- `caf subagents list` - List installed subagents
- `caf subagents remove <name>` - Remove a subagent
- `caf subagents update` - Update all subagents

### Plugins

Manage `coding-agent-fabric` plugins.

- `caf plugin add <source>` - Install a third-party plugin
- `caf plugin list` - List installed plugins
- `caf plugin remove <id>` - Remove a plugin

### System

System management and maintenance.

- `caf doctor` - Check the health of your installation and detected agents
- `caf check` - Check for updates across all resources
- `caf update` - Update all resources to their latest versions

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
