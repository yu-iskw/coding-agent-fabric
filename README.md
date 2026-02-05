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

## Workspace Layout

```text
packages/
  cli/          # Command-line interface and UX
  core/         # Lock management, source parsing, and resource handlers
  common/       # Shared types, constants, and utilities
  plugin-api/   # Base interfaces for third-party extensions
  plugins/      # (In development) Bundled resource handlers
```

## Quick Start

```bash
# Install dependencies
pnpm install

# Build the project
pnpm build

# Check installation health
coding-agent-fabric doctor
```

## CLI Examples

### Skills

```bash
# Add skills from a local directory or GitHub repo
coding-agent-fabric skills add ./my-skills
coding-agent-fabric skills add owner/repo

# List all installed skills
coding-agent-fabric skills list

# Remove a skill
coding-agent-fabric skills remove frontend-design
```

### Subagents

```bash
# Add subagents from a source
coding-agent-fabric subagents add ./my-agents

# List all installed subagents
coding-agent-fabric subagents list

# Remove a subagent
coding-agent-fabric subagents remove code-reviewer
```

### System & Plugins

```bash
# Check installation health and detected agents
coding-agent-fabric doctor

# List installed plugins
coding-agent-fabric plugin list
```

## Roadmap

- [ ] **Remote Plugin Installation**: Install plugins directly from npm or GitHub.
- [ ] **Hooks Plugin**: Manage agent-specific hooks (Pre/Post tool use).
- [ ] **MCP Plugin**: Manage Model Context Protocol (MCP) server configurations.
- [ ] **Auto-Updates**: Check for and install updates for managed resources.
- [ ] **Registry**: A central repository for sharing skills and subagents.

## License

MIT
