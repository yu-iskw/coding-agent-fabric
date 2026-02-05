# @coding-agent-fabric/core

Core system layer for coding-agent-fabric providing lock file management, source parsing, and agent registry.

## Features

- **LockManager**: Manages the v2 lock file for tracking installed resources and plugins
- **SourceParser**: Downloads and parses resources from various sources (GitHub, npm, local, etc.)
- **AgentRegistry**: Manages agent configurations and detection
- **SkillsHandler**: Manages skills resources with discovery, installation, and naming strategies
- **SubagentsHandler**: Manages subagent resources with format conversion support (YAML ↔ JSON)

## Installation

```bash
pnpm add @coding-agent-fabric/core
```

## Usage

### LockManager

```typescript
import { LockManager } from '@coding-agent-fabric/core';

// Initialize lock manager
const lockManager = new LockManager({
  projectRoot: process.cwd(),
});

// Load lock file (creates if doesn't exist)
const lockFile = await lockManager.load();

// Add a resource
await lockManager.addResource({
  type: 'skills',
  handler: 'built-in',
  name: 'my-skill',
  version: '1.0.0',
  source: 'owner/repo',
  sourceType: 'github',
  sourceUrl: 'https://github.com/owner/repo',
  installedAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  installedFor: [
    {
      agent: 'claude-code',
      scope: 'project',
      path: '/path/to/skill',
    },
  ],
  originalName: 'my-skill',
  installedName: 'my-skill',
  sourcePath: 'skills/my-skill',
  categories: [],
});

// Get resources by type
const skills = await lockManager.getResourcesByType('skills');

// Get resources for a specific agent
const claudeCodeResources = await lockManager.getResourcesForAgent('claude-code');
```

### SourceParser

```typescript
import { SourceParser } from '@coding-agent-fabric/core';

// Initialize source parser
const parser = new SourceParser();

// Parse a GitHub source
const result = await parser.parse('owner/repo');
console.log(result.localDir); // Local directory with downloaded files
console.log(result.files); // List of resource files
console.log(result.metadata); // Download metadata

// Parse with options
const result2 = await parser.parse('owner/repo', {
  targetDir: '/custom/path',
  extract: true,
});

// Parse different source types
await parser.parse('npm:my-package'); // npm package
await parser.parse('./local/path'); // local directory
await parser.parse('https://example.com/resource.tar.gz'); // HTTP URL
await parser.parse('registry:resource-id'); // registry resource
```

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

// Register a custom agent
registry.register({
  name: 'my-agent',
  displayName: 'My Agent',
  skillsDir: '.my-agent/skills',
  globalSkillsDir: '~/.my-agent/skills',
  detectInstalled: async () => {
    return existsSync('.my-agent');
  },
});
```

### SkillsHandler

```typescript
import { SkillsHandler, AgentRegistry, LockManager } from '@coding-agent-fabric/core';
import { parseSource } from '@coding-agent-fabric/common';

// Initialize components
const projectRoot = process.cwd();
const agentRegistry = new AgentRegistry(projectRoot);
const lockManager = new LockManager({ projectRoot });

const handler = new SkillsHandler({
  agentRegistry,
  lockManager,
  projectRoot,
});

// Discover skills from a local directory
const source = parseSource('./my-skills');
const resources = await handler.discover(source, {
  namingStrategy: 'smart-disambiguation',
});

// Install skills to target agents
await handler.install(
  resources[0],
  [
    { agent: 'claude-code', scope: 'project', mode: 'copy' },
    { agent: 'cursor', scope: 'project', mode: 'copy' },
  ],
  {
    force: false,
    yes: true,
  },
);

// List installed skills
const installed = await handler.list('both');

// Remove a skill
await handler.remove(resources[0], [{ agent: 'claude-code', scope: 'project', mode: 'copy' }], {
  yes: true,
});
```

### SubagentsHandler

```typescript
import { SubagentsHandler, AgentRegistry, LockManager } from '@coding-agent-fabric/core';
import { parseSource } from '@coding-agent-fabric/common';

// Initialize components
const projectRoot = process.cwd();
const agentRegistry = new AgentRegistry(projectRoot);
const lockManager = new LockManager({ projectRoot });

const handler = new SubagentsHandler({
  agentRegistry,
  lockManager,
  projectRoot,
});

// Discover subagents from a local directory
const source = parseSource('./my-subagents');
const resources = await handler.discover(source);

// Install subagents with format conversion
await handler.install(
  resources[0],
  [
    { agent: 'claude-code', scope: 'project', mode: 'copy' }, // Converts to YAML
    { agent: 'cursor', scope: 'project', mode: 'copy' }, // Keeps as JSON
  ],
  {
    force: false,
    yes: true,
  },
);

// List installed subagents
const installed = await handler.list('both');
```

## Lock File Schema (v2)

The lock file follows the v2 schema defined in `@coding-agent-fabric/common`:

```json
{
  "version": 2,
  "lastUpdated": "2026-02-05T12:00:00.000Z",
  "config": {
    "preferredAgents": ["claude-code"],
    "defaultScope": "project",
    "historyLimit": 10,
    "updateStrategy": "parallel",
    "namingStrategy": "smart-disambiguation"
  },
  "plugins": {
    "@coding-agent-fabric/plugin-claude-code-hooks": {
      "version": "1.0.0",
      "installedAt": "2026-02-05T12:00:00.000Z",
      "enabled": true,
      "location": "bundled"
    }
  },
  "resources": {
    "my-skill": {
      "type": "skills",
      "handler": "built-in",
      "name": "my-skill",
      "version": "1.0.0",
      "source": "owner/repo",
      "sourceType": "github",
      "sourceUrl": "https://github.com/owner/repo",
      "installedAt": "2026-02-05T12:00:00.000Z",
      "updatedAt": "2026-02-05T12:00:00.000Z",
      "installedFor": [
        {
          "agent": "claude-code",
          "scope": "project",
          "path": ".claude/skills/my-skill"
        }
      ],
      "originalName": "my-skill",
      "installedName": "my-skill",
      "sourcePath": "skills/my-skill",
      "categories": []
    }
  },
  "sources": {
    "owner/repo": {
      "lastChecked": "2026-02-05T12:00:00.000Z",
      "availableUpdates": {}
    }
  }
}
```

## API Reference

### LockManager API

- `initialize(config?)`: Initialize a new lock file
- `load()`: Load the lock file from disk
- `save(lockFile)`: Save the lock file to disk
- `exists()`: Check if lock file exists
- `getPath()`: Get lock file path
- `addResource(entry)`: Add or update a resource entry
- `removeResource(name)`: Remove a resource entry
- `getResource(name)`: Get a resource entry by name
- `getAllResources()`: Get all resource entries
- `getResourcesByType(type)`: Get resources by type
- `getResourcesByHandler(handler)`: Get resources by handler
- `getResourcesForAgent(agent, scope?)`: Get resources for an agent
- `addPlugin(name, entry)`: Add or update a plugin entry
- `removePlugin(name)`: Remove a plugin entry
- `getPlugin(name)`: Get a plugin entry by name
- `getAllPlugins()`: Get all plugin entries
- `updateSourceMetadata(source, metadata)`: Update source metadata
- `getSourceMetadata(source)`: Get source metadata
- `updateConfig(config)`: Update configuration
- `getConfig()`: Get configuration

### SourceParser API

- `parse(input, options?)`: Parse and download a source
- `clearCache()`: Clear the cache directory

### AgentRegistry API

- `register(config)`: Register a new agent configuration
- `get(name)`: Get agent configuration by name
- `getAll()`: Get all registered agents
- `getAllNames()`: Get all registered agent names
- `has(name)`: Check if an agent is registered
- `detectInstalled()`: Detect installed agents
- `getSkillsDir(agent, global?)`: Get the skills directory for an agent
- `getHooksDir(agent, global?)`: Get the hooks directory for an agent
- `getSubagentsDir(agent, global?)`: Get the subagents directory for an agent
- `getMcpConfigFile(agent, global?)`: Get the MCP config file for an agent
- `getResourceDir(agent, resourceType, global?)`: Get resource directory for a specific type

### SkillsHandler API

- `discover(source, options?)`: Discover skills from a source
- `install(resource, targets, options)`: Install a skill to target agents
- `remove(resource, targets, options)`: Remove a skill from target agents
- `list(scope)`: List installed skills
- `validate(resource)`: Validate a skill resource
- `getSupportedAgents()`: Get list of supported agents
- `getInstallPath(agent, scope)`: Get installation path for an agent

### SubagentsHandler API

- `discover(source, options?)`: Discover subagents from a source
- `install(resource, targets, options)`: Install a subagent to target agents (with format conversion)
- `remove(resource, targets, options)`: Remove a subagent from target agents
- `list(scope)`: List installed subagents
- `validate(resource)`: Validate a subagent resource
- `getSupportedAgents()`: Get list of agents that support subagents
- `getInstallPath(agent, scope)`: Get installation path for an agent

## Development

```bash
# Build
pnpm build

# Test
pnpm test

# Clean
pnpm clean
```

## License

MIT
