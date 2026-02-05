# @coding-agent-fabric/plugin-api

Plugin API and base interfaces for coding-agent-fabric resource handlers.

## Overview

This package defines the core plugin system for coding-agent-fabric. It includes:

- **ResourceHandler Interface**: Standard interface that all resource handlers (core and plugin) must implement
- **Plugin Manifest**: Schema for plugin.json files
- **Plugin Registry**: Types for managing loaded plugins
- **Plugin Lifecycle**: Hooks for plugin initialization and cleanup

## Installation

This package is internal to the coding-agent-fabric monorepo and is not published separately.

## Usage

### Implementing a Resource Handler

```typescript
import { ResourceHandler, BaseResourceHandler } from '@coding-agent-fabric/plugin-api';
import type { Resource, ParsedSource, AgentType } from '@coding-agent-fabric/plugin-api';

class MyResourceHandler extends BaseResourceHandler {
  readonly type = 'my-resource';
  readonly displayName = 'My Resource';
  readonly description = 'Handles my custom resource type';
  readonly isCore = false; // Plugin handler

  async discover(source: ParsedSource): Promise<Resource[]> {
    // Implementation
  }

  async install(
    resource: Resource,
    targets: InstallTarget[],
    options: InstallOptions,
  ): Promise<void> {
    // Implementation
  }

  // ... implement other required methods
}
```

### Creating a Plugin

```typescript
// plugin.json
{
  "id": "my-resource-plugin",
  "name": "@my-org/my-resource-plugin",
  "version": "1.0.0",
  "description": "My custom resource plugin",
  "author": "Your Name",
  "resourceType": "my-resource",
  "supportedAgents": ["claude-code", "cursor"],
  "entry": "./handler.js"
}
```

```typescript
// handler.ts
import { PluginExport, PluginContext } from '@coding-agent-fabric/plugin-api';
import { MyResourceHandler } from './my-resource-handler.js';

const plugin: PluginExport = {
  async onLoad(context: PluginContext) {
    context.log.info('My plugin loaded');
  },

  createHandler(context: PluginContext) {
    return new MyResourceHandler();
  },
};

export default plugin;
```

## Exports

### Interfaces

- `ResourceHandler` - Core interface for all resource handlers
- `BaseResourceHandler` - Abstract base class with default implementations
- `PluginManifest` - Plugin manifest schema
- `PluginMetadata` - Runtime plugin information
- `PluginContext` - Context provided to plugins
- `PluginExport` - Plugin export interface
- `PluginRegistry` - Plugin registry interface
- `PluginLoader` - Plugin loader interface
- `PluginDiscovery` - Plugin discovery interface
- `PluginInstaller` - Plugin installer interface

### Re-exported Types

Common types from `@coding-agent-fabric/common`:

- `AgentType`, `Resource`, `InstallTarget`, `ParsedSource`, `InstalledResource`, `ValidationResult`, `UpdateCheck`, `DiscoverOptions`, `InstallOptions`, `RemoveOptions`, `Scope`

## Architecture

The plugin system follows these principles:

1. **Core vs. Plugin Separation**: Skills and subagents are built-in (isCore: true), while hooks, MCP, and custom types are plugins (isCore: false)
2. **Unified Interface**: All handlers implement the same `ResourceHandler` interface
3. **Plugin Lifecycle**: Plugins can hook into load/unload/config-change events
4. **Agent-Specific Logic**: Plugins can implement agent-specific behavior while core handles universal resources

## License

Apache-2.0
