# @coding-agent-fabric/cli

Command-line interface for coding-agent-fabric.

## Installation

```bash
npm install -g @coding-agent-fabric/cli
```

## Usage

```bash
# Install skills
caf skills add owner/repo

# Install subagents
caf subagents add owner/repo

# List installed resources
caf skills list
caf subagents list

# Remove resources
caf skills remove skill-name
caf subagents remove subagent-name

# Update resources
caf skills update
caf subagents update
```

## Commands

### Skills

- `caf skills add <source>` - Install skills from a source
- `caf skills list` - List installed skills
- `caf skills remove <name>` - Remove a skill
- `caf skills update` - Update all skills

### Subagents

- `caf subagents add <source>` - Install subagents from a source
- `caf subagents list` - List installed subagents
- `caf subagents remove <name>` - Remove a subagent
- `caf subagents update` - Update all subagents

## Options

- `-g, --global` - Install globally
- `-f, --force` - Force reinstall
- `-y, --yes` - Skip confirmation prompts
- `--agent <agent>` - Target specific agent (claude-code, cursor, etc.)
