# coding-agent-fabric-common

Shared types, utilities, and constants for coding-agent-fabric.

## Overview

This package provides the foundational types and utilities used across all coding-agent-fabric packages. It includes:

- **Types**: Core type definitions for resources, agents, sources, and lock files
- **Constants**: Configuration constants and default values
- **Utilities**: Helper functions for parsing sources, path manipulation, and more

## Installation

This package is internal to the coding-agent-fabric monorepo and is not published separately.

## Usage

```typescript
import {
  AgentType,
  Resource,
  ParsedSource,
  parseSource,
  getCurrentTimestamp,
  LOCK_FILE_VERSION,
} from 'coding-agent-fabric-common';

// Parse a source string
const source = parseSource('vercel-labs/agent-skills');
console.log(source); // { type: 'github', owner: 'vercel-labs', repo: 'agent-skills', ... }

// Get current timestamp
const timestamp = getCurrentTimestamp();
```

## Exports

### Types

- `AgentType` - Supported agent types
- `Scope` - Installation scope (global/project)
- `InstallMode` - Installation mode (symlink/copy)
- `SourceType` - Source types (github/gitlab/npm/local/http/registry)
- `NamingStrategy` - Conflict resolution strategies
- `ParsedSource` - Parsed source information
- `Resource` - Base resource definition
- `InstallTarget` - Installation target configuration
- `InstalledResource` - Installed resource information
- `ValidationResult` - Validation result
- `UpdateCheck` - Update check result
- `AgentConfig` - Agent configuration
- `LockFile` - Lock file structure (version 2)
- And many more...

### Constants

- `LOCK_FILE_VERSION` - Current lock file version (2)
- `CONFIG_DIR_NAME` - Configuration directory name (.coding-agent-fabric)
- `SKILL_FILE_NAME` - Skill file name (SKILL.md)
- `CORE_RESOURCE_TYPES` - Core resource types (skills, subagents)
- `BUNDLED_PLUGINS` - Bundled plugin IDs
- And many more...

### Utilities

- `parseSource(input)` - Parse a source string into ParsedSource
- `normalizePath(path)` - Normalize a path (expand ~, remove trailing slashes)
- `isValidSemver(version)` - Check if a version is valid semver
- `compareSemver(v1, v2)` - Compare two semantic versions
- `getCurrentTimestamp()` - Get current ISO timestamp
- `extractCategories(sourcePath)` - Extract categories from path
- `generateSmartName(originalName, categories)` - Generate disambiguated name
- And many more...

## License

Apache-2.0
