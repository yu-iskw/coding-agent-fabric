# coding-agent-fabric

`coding-agent-fabric` is a unified CLI for managing AI coding-agent resources.

Core resources:

- `skills` (built-in)
- `subagents` (built-in)

Plugin-managed resources:

- `hooks` (Claude Code, Cursor, Gemini CLI plugins)
- `mcp` (MCP servers plugin)

## Workspace Layout

```text
packages/
  cli/          # command router + UX
  core/         # lock manager, source parser, plugin manager, core handlers
  common/       # shared types + fs helpers
  plugin-api/   # ResourceHandler interface
  plugins/
    claude-code-hooks/
    cursor-hooks/
    gemini-cli-hooks/
    mcp/
```

## Quick Start

```bash
pnpm install
pnpm build
pnpm test
```

## CLI Examples

```bash
# Skills (core)
coding-agent-fabric skills add ./my-resources
coding-agent-fabric skills list
coding-agent-fabric skills remove frontend-design

# Subagents (core)
coding-agent-fabric subagents add ./my-resources
coding-agent-fabric subagents list

# Hooks and MCP (plugin-managed)
coding-agent-fabric hooks add ./my-resources --agent claude-code
coding-agent-fabric mcp add ./my-resources --agent codex

# Plugin management
coding-agent-fabric plugin list
coding-agent-fabric plugin add @coding-agent-fabric/plugin-cursor-hooks
```
