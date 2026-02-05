# @coding-agent-fabric/core

Core logic and system layer for coding-agent-fabric.

## Overview

The core package provides the foundational classes and logic for managing AI agent resources:

- **AgentRegistry**: Manages agent configurations and detects installed agents
- **SkillsHandler**: Manages skills resources with discovery, installation, and naming strategies
- **SubagentsHandler**: Manages subagent resources with format conversion support (YAML ↔ JSON)
- **PluginManager**: Manages the lifecycle of third-party plugins

## Resource Management

Resource management in `coding-agent-fabric` leverages `pnpm` for downloading, versioning, and caching. Resources (skills, subagents, etc.) are installed as dev dependencies in the project's `package.json`, and then "deployed" to the specific directories expected by each agent (e.g., `.claude/skills/`).

## Usage

### AgentRegistry

```typescript
import { AgentRegistry } from '@coding-agent-fabric/core';

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
import { SkillsHandler, AgentRegistry } from '@coding-agent-fabric/core';

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
import { SubagentsHandler, AgentRegistry } from '@coding-agent-fabric/core';

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
pnpm add @coding-agent-fabric/core
```
