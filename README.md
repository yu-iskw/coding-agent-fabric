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

### plugin

Manage coding-agent-fabric plugins

```bash
# Install a third-party plugin
coding-agent-fabric plugin add
# List installed plugins
coding-agent-fabric plugin list
# Remove a plugin
coding-agent-fabric plugin remove
```

### skills

Manage AI agent skills

```bash
# Install skills from a source
coding-agent-fabric skills add
# List installed skills
coding-agent-fabric skills list
# Remove a skill
coding-agent-fabric skills remove
# Update all skills
coding-agent-fabric skills update
```

### subagents

Manage AI subagents

```bash
# Install subagents from a source
coding-agent-fabric subagents add
# List installed subagents
coding-agent-fabric subagents list
# Remove a subagent
coding-agent-fabric subagents remove
# Update all subagents
coding-agent-fabric subagents update
```

### system

System management commands

```bash
# Check the health of your installation
coding-agent-fabric doctor
# Check for updates across all resources
coding-agent-fabric check
# Update all resources to their latest versions
coding-agent-fabric update
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
