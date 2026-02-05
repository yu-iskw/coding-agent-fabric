# coding-agent-fabric

`coding-agent-fabric` is a universal CLI for managing AI coding-agent resources across multiple agents and platforms. It provides a unified way to discover, install, and manage skills, subagents, and other extensions.

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

### rules

Manage AI agent rules

```bash
# Install rules from a source
caf rules add
# List installed rules
caf rules list
# Remove a rule
caf rules remove
# Update all rules
caf rules update
```

### skills

Manage AI agent skills

```bash
# Install skills from a source
caf skills add
# List installed skills
caf skills list
# Remove a skill
caf skills remove
# Update all skills
caf skills update
```

### subagents

Manage AI subagents

```bash
# Install subagents from a source
caf subagents add
# List installed subagents
caf subagents list
# Remove a subagent
caf subagents remove
# Update all subagents
caf subagents update
```

### plugin

Manage coding-agent-fabric plugins

```bash
# Install a third-party plugin
caf plugin add
# List installed plugins
caf plugin list
# Remove a plugin
caf plugin remove
```

### system

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

## Roadmap

- [ ] **Remote Plugin Installation**: Install plugins directly from npm or GitHub.
- [ ] **Hooks Plugin**: Manage agent-specific hooks (Pre/Post tool use).
- [ ] **MCP Plugin**: Manage Model Context Protocol (MCP) server configurations.
- [ ] **Auto-Updates**: Check for and install updates for managed resources.
- [ ] **Registry**: A central repository for sharing skills and subagents.

## Contributing

Interested in contributing? Please read our [CONTRIBUTING.md](CONTRIBUTING.md) guide to set up your development environment.

## License

Apache License 2.0
