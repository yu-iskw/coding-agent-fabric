# @agentkit/core

> **Migration Note:** This package was formerly `@coding-agent-fabric/core`. See [Migration Guide](../../docs/migration-from-caf.md).

Core logic and system layer for **AgentKit** - universal control plane for coding agents.

## Overview

The core package provides the foundational classes and logic for managing AI agent resources:

- **ResourceRegistry**: Canonical storage and management for all resources (v0.2+)
- **AgentRegistry**: Manages agent configurations and detects installed agents
- **SkillsHandler**: Manages skills resources with discovery and installation
- **SubagentsHandler**: Manages subagent resources with format conversion (YAML ↔ JSON)
- **RulesHandler**: Manages agent rules and policies
- **PluginManager**: Manages the lifecycle of third-party plugins
- **Renderers**: Translate canonical resources to agent-specific formats (v0.2+)

## Architecture

AgentKit v0.2 introduces a **canonical resource model**:

1. **Canonical Storage**: All resources normalized into a unified schema
2. **Renderers**: Translate canonical → agent-specific formats (`.claude/`, `.cursor/`, `.codex/`)
3. **Plugin System**: Extend with agent-specific hooks and MCP management

Resource management leverages `pnpm` for downloading, versioning, and caching. Resources are installed as dev dependencies, then synchronized to agent directories.

## Usage

### AgentRegistry

```typescript
import { AgentRegistry } from '@agentkit/core';

// Initialize agent registry
const registry = new AgentRegistry(process.cwd());

// Get agent configuration
const claudeCode = registry.get('claude-code');
console.log(claudeCode?.skillsDir); // .claude/skills

// Detect installed agents
const installed = await registry.detectInstalled();
console.log(installed); // ['claude-code', 'cursor']

// Get skills directory for an agent
const skillsDir = registry.getSkillsDir('claude-code');
const globalSkillsDir = registry.getSkillsDir('claude-code', true);
```

### SkillsHandler

```typescript
import { SkillsHandler, AgentRegistry } from '@agentkit/core';

const agentRegistry = new AgentRegistry(projectRoot);
const handler = new SkillsHandler({
  agentRegistry,
  projectRoot,
});

// Discover skills in an installed package
const resources = await handler.discoverFromPath('./node_modules/some-skills-pkg');

// Install a skill to Claude Code
await handler.install(resources[0], [{ agent: 'claude-code', scope: 'project', mode: 'symlink' }], {
  force: true,
});
```

### SubagentsHandler

```typescript
import { SubagentsHandler, AgentRegistry } from '@agentkit/core';

const agentRegistry = new AgentRegistry(projectRoot);
const handler = new SubagentsHandler({
  agentRegistry,
  projectRoot,
});

// Discover subagents
const resources = await handler.discoverFromPath('./node_modules/some-agents-pkg');

// Install
await handler.install(resources[0], [{ agent: 'claude-code', scope: 'project', mode: 'copy' }], {
  force: true,
});
```

## Installation

```bash
pnpm add @agentkit/core
```
