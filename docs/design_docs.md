# coding-agent-fabric Design Document

**Project:** coding-agent-fabric - Universal Resource Manager for AI Coding Agents
**Version:** 2.0
**Status:** Draft - Core vs. Plugins Architecture
**Last Updated:** 2026-02-04
**Author:** coding-agent-fabric Team

**Architecture Revision:** This document reflects the revised architecture where **Skills and Subagents** are core built-in features, while **Hooks, MCP Servers, and custom resources** are managed through a **plugin system**. See [Architecture Revision Document](./architecture-revision-core-vs-plugins.md) for detailed rationale.

---

## Table of Contents

1. [Overview & Vision](#overview--vision)
2. [Goals & Non-Goals](#goals--non-goals)
3. [Architecture](#architecture)
4. [User Experience](#user-experience)
5. [Technical Design](#technical-design)
6. [Implementation Plan](#implementation-plan)
7. [Migration from Skills CLI](#migration-from-skills-cli)
8. [Open Questions](#open-questions)

---

## Overview & Vision

### Problem Statement

The AI coding agent ecosystem (Claude Code, Cursor, Gemini CLI, Codex, and 35+ others) is rapidly evolving with multiple resource types:

- **Skills** - Reusable instruction sets (e.g., commit message guidelines, PR templates)
- **Hooks** - Event-driven automation (e.g., pre-commit linters, post-install scripts)
- **Subagents** - Specialized AI agents for specific tasks (e.g., testing specialist, security auditor)
- **MCP Servers** - Model Context Protocol integrations (e.g., database access, API connectors)
- **Custom Resources** - User-defined or experimental resource types

Currently, these resources are managed through:

- Manual file copying and configuration
- Agent-specific tools (e.g., Claude Code's `/skills` directory)
- The `skills` CLI (which only handles skills)

This fragmentation leads to:

- **Poor discoverability** - Users don't know what resources are available
- **Inconsistent installation** - Each resource type has different installation steps
- **No cross-agent compatibility** - Resources built for one agent don't work elsewhere
- **Update friction** - No centralized update mechanism

### Vision

**coding-agent-fabric is the unified operating system for AI coding agents.**

It provides:

1. **Single CLI interface** for managing all agent resources
2. **Cross-agent compatibility** - Write once, run on 39+ agents
3. **Centralized discovery** - Search and install resources from registries
4. **Update management** - Track versions, check for updates, apply patches
5. **Extensibility** - Plugin system for custom resource types

### Success Criteria

- Developers can install any resource type with a single command
- Resources work across multiple agents without modification
- coding-agent-fabric becomes the de facto standard for agent resource distribution
- 10,000+ installs in first 6 months
- Community contributes 50+ resources in first year

---

## Goals & Non-Goals

### Goals

#### Phase 1 (MVP - 3 months)

- ✅ Support **2 core resource types**: Skills, Subagents
- ✅ Plugin system infrastructure for agent-specific resource types
- ✅ **Bundled first-party plugins**: Claude Code Hooks, Cursor Hooks, MCP Servers
- ✅ Unified CLI with `coding-agent-fabric <resource> <action>` syntax
- ✅ Install resources from GitHub repositories and local paths
- ✅ Cross-agent compatibility for 39+ agents (leverage existing agent registry from skills CLI)
- ✅ Single lock file (`.coding-agent-fabric/lock.json`) for version tracking
- ✅ Project and global installation scopes (global precedence)
- ✅ Basic update checking and installation
- ✅ Nested directory support with configurable naming strategies

#### Phase 2 (Plugin Ecosystem - 2 months)

- ✅ Plugin discovery and management (`coding-agent-fabric plugin` commands)
- ✅ Community plugin support (third-party plugins)
- ✅ Resource discovery from registries (skills.sh, npm, custom endpoints)
- ✅ Resource dependencies (e.g., "this hook requires this skill")
- ✅ Interactive search and installation (`coding-agent-fabric find`)

#### Phase 3 (Ecosystem - 4 months)

- ✅ coding-agent-fabric Registry (centralized resource directory)
- ✅ Resource versioning and semver support
- ✅ Resource health checks and validation
- ✅ Documentation and community onboarding

### Non-Goals

- ❌ **Not a package manager replacement** - coding-agent-fabric doesn't install npm packages, Python libraries, or system dependencies (use npm/pip/apt for that)
- ❌ **Not an agent runtime** - coding-agent-fabric doesn't execute agents; it manages resources for agents
- ❌ **Not a code editor** - coding-agent-fabric doesn't provide an IDE; it complements existing agents
- ❌ **Not agent-specific** - coding-agent-fabric won't implement features for only one agent (must be cross-agent compatible)
- ❌ **Not backward compatible with `skills` CLI** - This is a new project, not an upgrade path

---

## Architecture

### High-Level Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                         coding-agent-fabric CLI                         │
├─────────────────────────────────────────────────────────────┤
│  Command Router (coding-agent-fabric <resource> <action>)               │
│    ├── skills (core)                                         │
│    ├── subagents (core)                                      │
│    ├── hooks (via plugin) ─┐                                │
│    ├── mcp (via plugin)    │  Require plugin installation   │
│    └── plugin commands     ─┘                                │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                     Core System Layer                       │
├─────────────────────────────────────────────────────────────┤
│  ┌────────────────┐  ┌────────────────┐  ┌───────────────┐ │
│  │ Agent Registry │  │ Source Parser  │  │ Lock Manager  │ │
│  │ (39+ agents)   │  │ (git, local,   │  │ (version 2)   │ │
│  │                │  │  npm, http)    │  │               │ │
│  └────────────────┘  └────────────────┘  └───────────────┘ │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────────┐ │
│  │  Installer     │  │   Discovery    │  │Plugin Manager │ │
│  │  (symlink,     │  │   (nested dirs,│  │ (load/register│ │
│  │  copy,flatten) │  │  categories)   │  │  plugins)     │ │
│  └────────────────┘  └────────────────┘  └───────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Naming Strategies                                     │ │
│  │  (smart-disambiguation, full-path-prefix, etc.)        │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                  Resource Handler Layer                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │          Built-In Handlers (Core)                   │   │
│  │  ┌──────────┐           ┌──────────┐               │   │
│  │  │  Skills  │           │ Subagents│               │   │
│  │  │ Handler  │           │ Handler  │               │   │
│  │  └──────────┘           └──────────┘               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │    Bundled Plugins (Shipped with coding-agent-fabric)           │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │   │
│  │  │ Claude Code │  │   Cursor    │  │     MCP     │ │   │
│  │  │    Hooks    │  │    Hooks    │  │   Servers   │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │       Third-Party Plugins (User-Installed)          │   │
│  │  Loaded from: .coding-agent-fabric/plugins/ or ~/.coding-agent-fabric/plugins/│   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    Target Agents (39+)                      │
├─────────────────────────────────────────────────────────────┤
│  Claude Code │ Cursor │ Codex │ Gemini CLI │ ...           │
│                                                              │
│  Installation Paths (Project + Global with precedence):     │
│    - .claude/skills/, .claude/agents/, .claude/settings.json│
│    - .cursor/skills/, .cursor/hooks.json                    │
│    - ~/.claude/skills/ (global fallback)                    │
└─────────────────────────────────────────────────────────────┘
```

**Key Architectural Decisions:**

1. **Core Handlers:** Skills and subagents are built into coding-agent-fabric (universal formats)
2. **Bundled Plugins:** Hooks and MCP plugins ship with coding-agent-fabric by default (agent-specific)
3. **Plugin Loading:** Check `.coding-agent-fabric/plugins/` first, fallback to `~/.coding-agent-fabric/plugins/`
4. **Error on Missing Plugin:** If user tries `coding-agent-fabric hooks add` without plugin, show clear error with installation command

### Repository Structure (pnpm Monorepo)

To ensure modularity and reusability, `coding-agent-fabric` is structured as a pnpm monorepo:

```text
coding-agent-fabric/
  package.json              # Root package.json
  pnpm-workspace.yaml       # pnpm workspace configuration
  packages/
    cli/                    # CLI entry point and command routing
    core/                   # Core logic (Agent Registry, Source Parser, Lock Manager)
    common/                 # Shared types, utilities, and constants
    plugin-api/             # Interface and base classes for plugins
    plugins/                # First-party bundled plugins
      claude-code-hooks/
      cursor-hooks/
      mcp/
```

### Core Principles

1. **Core vs. Plugin Separation**

- **Core Resources:** Skills and subagents (universal formats, cross-agent compatible)
- **Plugin Resources:** Hooks, MCP, and custom types (agent-specific formats)
- Core handles common operations; plugins handle agent-specific complexity

2. **Resource Type Abstraction**

- All resource types implement a common `ResourceHandler` interface
- Core system treats all resources uniformly (install, remove, list, update)
- Resource-specific logic isolated in handlers (built-in or plugin)
- `isCore` flag distinguishes built-in from plugin handlers

3. **Agent Abstraction**

- Agents defined in a centralized registry (inherited from skills CLI)
- Each agent specifies installation paths for each resource type
- Dynamic agent detection (check for config files, binaries)
- Agent-specific features handled by dedicated plugins

4. **Source Abstraction**

- Resources can come from multiple sources (GitHub, GitLab, local paths, npm, HTTP)
- `SourceParser` normalizes all sources into a common format
- Extensible via provider system

5. **Single Lock File**

- `.coding-agent-fabric/lock.json` tracks all installed resources across all types
- Includes plugin tracking section
- Enables version tracking, update checking, and dependency resolution
- Schema uses discriminated unions for type-specific metadata

6. **Plugin Architecture**

- Bundled plugins (hooks, MCP) ship with coding-agent-fabric
- Third-party plugins loadable from `.coding-agent-fabric/plugins/` (project) or `~/.coding-agent-fabric/plugins/` (global)
- Global precedence: project plugins checked first, fallback to global
- Clear error messages when required plugin is missing

---

## User Experience

### Command Structure

**Format:** `coding-agent-fabric <resource> <action> [options]`

#### Core Commands (No Plugin Required)

```bash
# Skills (core feature)
coding-agent-fabric skills add vercel-labs/agent-skills
coding-agent-fabric skills list
coding-agent-fabric skills remove web-design-guidelines
coding-agent-fabric skills find typescript

# Subagents (core feature)
coding-agent-fabric subagents add openai/code-reviewer
coding-agent-fabric subagents list
coding-agent-fabric subagents remove code-reviewer
```

#### Plugin Commands (Bundled with coding-agent-fabric)

```bash
# Hooks (requires plugin, but bundled by default)
coding-agent-fabric hooks add my-org/pre-commit-linter
coding-agent-fabric hooks list
coding-agent-fabric hooks remove pre-commit-linter

# Note: If hooks plugin not installed, coding-agent-fabric shows:
# Error: 'hooks' requires a plugin.
# Install with: coding-agent-fabric plugin add @coding-agent-fabric/plugin-claude-code-hooks

# MCP Servers (requires plugin, bundled by default)
coding-agent-fabric mcp add mcp-server-sqlite
coding-agent-fabric mcp list
coding-agent-fabric mcp remove mcp-server-sqlite
```

#### Plugin Management Commands

```bash
# List installed plugins (includes bundled + third-party)
coding-agent-fabric plugin list

# Install third-party plugin
coding-agent-fabric plugin add @community/custom-resource-plugin

# Remove plugin
coding-agent-fabric plugin remove @coding-agent-fabric/plugin-cursor-hooks

# Update all plugins
coding-agent-fabric plugin update

# Search for plugins
coding-agent-fabric plugin search hooks
```

#### Universal Commands (Work Across All Resource Types)

```bash
coding-agent-fabric check           # Check for updates across all resources
coding-agent-fabric update          # Update all resources
coding-agent-fabric clean           # Remove orphaned symlinks
coding-agent-fabric doctor          # Validate installation health
```

#### Options (Consistent Across Resource Types)

```bash
-g, --global              # Install to user directory (~/) instead of project
-a, --agent <agents...>   # Target specific agents (e.g., claude-code, cursor)
-y, --yes                 # Skip confirmation prompts (CI-friendly)
-l, --list                # List available resources without installing
-f, --force               # Force reinstall even if already installed
--dry-run                 # Show what would be installed without doing it
```

### Installation Flows

#### Example 1: Installing Skills

```bash
# Install a skill from GitHub
$ coding-agent-fabric skills add vercel-labs/agent-skills

Discovering resources from vercel-labs/agent-skills...
Found 12 skills:
  ✓ frontend-design
  ✓ web-design-guidelines
  ✓ commit-conventions
  ... (9 more)

Select skills to install: (Use ↑↓ to navigate, Space to select, Enter to confirm)
  ◉ frontend-design
  ◯ web-design-guidelines
  ◉ commit-conventions

Detected agents: claude-code, cursor, codex

Install to:
  ◉ Project (.claude/skills/, .cursor/skills/, .codex/skills/)
  ◯ Global (~/.claude/skills/, ~/.cursor/skills/, ~/.codex/skills/)

Installation method:
  ◉ Symlink (Recommended - single source of truth)
  ◯ Copy (Independent copies per agent)

Installing frontend-design...
  ✓ Canonical copy → .agents/skills/frontend-design/
  ✓ Symlink → .claude/sk/ills/frontend-design
  ✓ Symlink → .cursor/skills/frontend-design
  ✓ Symlink → .codex/skills/frontend-design

Installing commit-conventions...
  ✓ Canonical copy → .agents/skills/commit-conventions/
  ✓ Symlink → .claude/skills/commit-conventions
  ✓ Symlink → .cursor/skills/commit-conventions
  ✓ Symlink → .codex/skills/commit-conventions

Updated .coding-agent-fabric/lock.json

✓ Successfully installed 2 skills for 3 agents
```

#### Example 2: Installing Hooks (Non-Interactive)

```bash
$ coding-agent-fabric hooks add my-org/linters --agent claude-code --yes

Discovering resources from my-org/linters...
Found 3 hooks: pre-commit, pre-push, post-install

Installing all hooks for claude-code...
  ✓ pre-commit → .claude/hooks/pre-commit.js
  ✓ pre-push → .claude/hooks/pre-push.js
  ✓ post-install → .claude/hooks/post-install.js

✓ Successfully installed 3 hooks
```

#### Example 3: Listing Installed Resources

```bash
$ coding-agent-fabric skills list

Project Skills (.agents/skills/)
  ✓ frontend-design v1.2.0 (vercel-labs/agent-skills)
  ✓ commit-conventions v1.0.0 (vercel-labs/agent-skills)

Global Skills (~/.agents/skills/)
  ✓ security-audit v2.1.0 (my-org/security)

Installed for agents: claude-code, cursor, codex
```

#### Example 4: Cross-Resource Discovery

```bash
$ coding-agent-fabric find react

Searching all resource types for "react"...

Skills (2 results)
  react-best-practices - Guidelines for React development
  react-testing - Testing patterns for React apps

Hooks (1 result)
  react-lint-hook - ESLint pre-commit hook for React

MCP Servers (1 result)
  mcp-react-inspector - Inspect React component tree

Install a resource? (y/n) y
Select resource type: Skills
Select resource: react-best-practices

Installing react-best-practices...
✓ Done
```

---

## Technical Design

### 1. Resource Handler Interface

All resource types implement this interface (whether built-in or plugin):

```typescript
interface ResourceHandler {
  // Metadata
  readonly type: string; // "skills", "hooks", "subagents", "mcp"
  readonly displayName: string; // "Skills", "Hooks", "Subagents", "MCP Servers"
  readonly description: string;
  readonly isCore: boolean; // true for built-in (skills, subagents), false for plugins

  // Discovery
  discover(source: ParsedSource, options?: DiscoverOptions): Promise<Resource[]>;

  // Lifecycle
  install(resource: Resource, targets: InstallTarget[], options: InstallOptions): Promise<void>;
  remove(resource: Resource, targets: InstallTarget[], options: RemoveOptions): Promise<void>;
  list(scope: 'global' | 'project' | 'both'): Promise<InstalledResource[]>;

  // Validation
  validate(resource: Resource): Promise<ValidationResult>;

  // Updates (optional)
  checkUpdates?(resources: InstalledResource[]): Promise<UpdateCheck[]>;
  update?(resource: InstalledResource, target?: string): Promise<void>;

  // Agent compatibility
  getSupportedAgents(): AgentType[];
  getInstallPath(agent: AgentType, scope: 'global' | 'project'): string;
}
```

**Key Changes from Original Design:**

- Added `isCore` flag to distinguish built-in handlers from plugin handlers
- Plugins implement the same interface but with `isCore: false`

```typescript
interface Resource {
  type: string; // Handler type
  name: string; // Unique identifier
  version?: string; // Semantic version
  description: string;
  metadata: Record<string, unknown>; // Type-specific metadata
  files: ResourceFile[]; // Files to install
  dependencies?: ResourceDependency[];
}

interface InstallTarget {
  agent: AgentType;
  scope: 'global' | 'project';
  mode: 'symlink' | 'copy';
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
```

### 2. Built-In Resource Handlers

coding-agent-fabric includes two built-in resource handlers that work across all agents:

#### Skills Handler

```typescript
class SkillsHandler implements ResourceHandler {
  type = 'skills';
  displayName = 'Skills';
  isCore = true; // Built-in handler

  async discover(source: ParsedSource): Promise<Resource[]> {
    // Scan for SKILL.md files (supports nested directories)
    // Parse YAML frontmatter (name, description, metadata)
    // Extract categories from directory path
    // Apply naming strategy (smart-disambiguation, full-path-prefix, etc.)
    // Return array of Skill resources
  }

  async install(skill: Resource, targets: InstallTarget[], options: InstallOptions): Promise<void> {
    // 1. Create canonical copy in .agents/skills/<installedName>/
    // 2. For each agent × target:
    //    - Create symlink or copy to agent's skills directory
    //    - Apply flattening if nested source structure
    // 3. Update lock file with source path and categories
  }

  getInstallPath(agent: AgentType, scope: 'global' | 'project'): string {
    const agentConfig = AGENT_REGISTRY[agent];
    return scope === 'global' ? agentConfig.globalSkillsDir : agentConfig.skillsDir;
  }

  getSupportedAgents(): AgentType[] {
    // All 39+ agents support skills
    return Object.keys(AGENT_REGISTRY) as AgentType[];
  }
}
```

**Key Features:**

- Nested directory support with configurable naming strategies
- Category extraction from source path
- Universal compatibility (all agents support SKILL.md format)

#### Subagents Handler

```typescript
class SubagentsHandler implements ResourceHandler {
  type = 'subagents';
  displayName = 'Subagents';
  isCore = true; // Built-in handler

  async discover(source: ParsedSource): Promise<Resource[]> {
    // Scan for:
    //   - Claude Code format: YAML frontmatter in agent files
    //   - coding-agent-fabric format: subagent.json files
    // Parse: name, model, systemPrompt, tools, capabilities
    // Normalize to common format
  }

  async install(
    subagent: Resource,
    targets: InstallTarget[],
    options: InstallOptions,
  ): Promise<void> {
    // 1. Validate subagent config (required fields, valid model names)
    // 2. Install to .agents/subagents/<name>/
    // 3. For each agent:
    //    - Convert to agent-specific format (YAML for Claude Code, JSON for others)
    //    - Copy to agent's subagents directory
    //    - Validate agent supports subagent system
  }

  getSupportedAgents(): AgentType[] {
    // Claude Code has native subagent support (Task tool)
    // Others may add support over time
    return ['claude-code'];
  }
}
```

**Key Features:**

- Supports multiple subagent formats (Claude Code YAML, coding-agent-fabric JSON)
- Automatic format conversion based on target agent
- Validates subagent configuration before installation

### 3. Plugin Resource Handlers (Bundled)

Hooks and MCP Servers are implemented as plugins but **bundled with coding-agent-fabric by default**. See [Architecture Revision Document](./architecture-revision-core-vs-plugins.md) for detailed plugin specifications.

**Bundled Plugins:**

- `@coding-agent-fabric/plugin-claude-code-hooks` - Manages Claude Code hooks
- `@coding-agent-fabric/plugin-cursor-hooks` - Manages Cursor hooks
- `@coding-agent-fabric/plugin-gemini-cli-hooks` - Manages Gemini CLI hooks
- `@coding-agent-fabric/plugin-mcp` - Manages MCP servers across agents

**Why Plugins?**

- Hooks have incompatible specifications across agents (different JSON schemas, exit codes, event lifecycles)
- MCP installation varies by agent (config file locations, npm package handling)
- Allows each plugin to implement agent-specific logic without compromising core

**Plugin Discovery:**

- Bundled plugins are automatically available (no installation required)
- Check `.coding-agent-fabric/plugins/` first (project-specific)
- Fallback to `~/.coding-agent-fabric/plugins/` (user-global)
- If plugin missing, show clear error with installation command

**Example Error (Plugin Not Installed):**

```bash
$ coding-agent-fabric hooks add my-org/linters

Error: 'hooks' requires a plugin.

Install with:
  coding-agent-fabric plugin add @coding-agent-fabric/plugin-claude-code-hooks  # For Claude Code
  coding-agent-fabric plugin add @coding-agent-fabric/plugin-cursor-hooks       # For Cursor
  coding-agent-fabric plugin add @coding-agent-fabric/plugin-gemini-cli-hooks   # For Gemini CLI
```

### 4. Lock File Schema (Version 2)

**Location:** `.coding-agent-fabric/lock.json` (project scope) or `~/.coding-agent-fabric/lock.json` (global scope)

**Note:** For complete v2 schema with update history and granular management features, see the Granular Management Addendum.

````typescript
interface coding-agent-fabricLockFile {
  version: 2;  // Lock file format version
  lastUpdated: string;

  // Configuration
  config: {
    preferredAgents: string[];     // Default agents for new resources
    defaultScope: 'project' | 'global';
    historyLimit?: number;         // Max history entries per resource (default: 10)
    updateStrategy?: 'parallel' | 'sequential';  // Default: parallel
    namingStrategy?: NamingStrategy;  // Default naming strategy for skills
  };

  // Installed plugins
  plugins: Record<string, PluginLockEntry>;

  // Installed resources
  resources: Record<string, ResourceLockEntry>;

  // Source tracking
  sources?: Record<string, SourceMetadata>;
}

interface PluginLockEntry {
  version: string;
  installedAt: string;
  enabled: boolean;
  location: 'bundled' | 'project' | 'global';  // Where plugin is loaded from
}

```typescript
type NamingStrategy =
  | 'smart-disambiguation'
  | 'full-path-prefix'
  | 'category-prefix'
  | 'original-name';
```typescript
type ResourceLockEntry =
| SkillLockEntry
| HookLockEntry
| SubagentLockEntry
| MCPLockEntry
| PluginResourceLockEntry;

interface BaseLockEntry {
type: string; // Discriminator: "skills", "hooks", "subagents", "mcp", etc.
handler: string; // "built-in" or plugin ID (e.g., "@coding-agent-fabric/plugin-claude-code-hooks")
name: string;
version?: string;
source: string; // "owner/repo", "npm:package", "local:./path"
sourceType: string; // "github", "gitlab", "npm", "local"
sourceUrl: string;
installedAt: string;
updatedAt: string;
installedFor: {
agent: string;
scope: 'global' | 'project';
path: string;
}[];
}

interface SkillLockEntry extends BaseLockEntry {
type: 'skills';
handler: 'built-in'; // Skills are core
originalName: string; // Original name from SKILL.md
installedName: string; // Name after conflict resolution
sourcePath: string; // Path in source repo (e.g., "skills/frontend/react/patterns")
categories: string[]; // Extracted from source path
namingStrategy?: NamingStrategy;
skillFolderHash?: string; // GitHub tree SHA for update detection
}

interface SubagentLockEntry extends BaseLockEntry {
type: 'subagents';
handler: 'built-in'; // Subagents are core
model?: string; // Model identifier (e.g., "claude-sonnet-4")
format: 'claude-code-yaml' | 'coding-agent-fabric-json'; // Source format
configHash: string;
}

interface PluginResourceLockEntry extends BaseLockEntry {
type: string; // Resource type (e.g., "hooks", "mcp")
handler: string; // Plugin ID (e.g., "@coding-agent-fabric/plugin-claude-code-hooks")
metadata: Record<string, unknown>; // Plugin-specific metadata
}
```

**Example Lock File (v2):**

```json
{
  "version": 2,
  "lastUpdated": "2026-02-04T10:30:00Z",

  "config": {
    "preferredAgents": ["claude-code", "cursor"],
    "defaultScope": "project",
    "historyLimit": 10,
    "updateStrategy": "parallel",
    "namingStrategy": "smart-disambiguation"
  },

  "plugins": {
    "@coding-agent-fabric/plugin-claude-code-hooks": {
      "version": "1.0.0",
      "installedAt": "2026-02-01T10:00:00Z",
      "enabled": true,
      "location": "bundled"
    },
    "@coding-agent-fabric/plugin-mcp": {
      "version": "0.5.0",
      "installedAt": "2026-02-01T10:00:00Z",
      "enabled": true,
      "location": "bundled"
    }
  },

  "resources": {
    "frontend-design": {
      "type": "skills",
      "handler": "built-in",
      "name": "frontend-design",
      "originalName": "patterns",
      "installedName": "frontend-design",
      "sourcePath": "skills/frontend/react/patterns",
      "categories": ["frontend", "react"],
      "namingStrategy": "smart-disambiguation",
      "version": "1.2.0",
      "source": "vercel-labs/agent-skills",
      "sourceType": "github",
      "sourceUrl": "https://github.com/vercel-labs/agent-skills",
      "skillFolderHash": "abc123",
      "installedAt": "2026-02-01T12:00:00Z",
      "updatedAt": "2026-02-04T10:30:00Z",
      "installedFor": [
        {
          "agent": "claude-code",
          "scope": "project",
          "path": ".claude/skills/frontend-design"
        },
        {
          "agent": "cursor",
          "scope": "project",
          "path": ".cursor/skills/frontend-design"
        }
      ]
    },

    "pre-commit-linter": {
      "type": "hooks",
      "handler": "@coding-agent-fabric/plugin-claude-code-hooks",
      "name": "pre-commit-linter",
      "source": "my-org/linters",
      "sourceType": "github",
      "sourceUrl": "https://github.com/my-org/linters",
      "installedAt": "2026-02-03T14:00:00Z",
      "updatedAt": "2026-02-03T14:00:00Z",
      "installedFor": [
        {
          "agent": "claude-code",
          "scope": "project",
          "path": ".claude/settings.json"
        }
      ],
      "metadata": {
        "event": "PreToolUse",
        "matcher": "Bash",
        "command": ".claude/hooks/pre-commit.sh"
      }
    },

    "mcp-server-sqlite": {
      "type": "mcp",
      "handler": "@coding-agent-fabric/plugin-mcp",
      "name": "mcp-server-sqlite",
      "version": "0.1.0",
      "source": "npm:@modelcontextprotocol/server-sqlite",
      "sourceType": "npm",
      "sourceUrl": "https://www.npmjs.com/package/@modelcontextprotocol/server-sqlite",
      "installedAt": "2026-02-04T10:00:00Z",
      "updatedAt": "2026-02-04T10:00:00Z",
      "installedFor": [
        {
          "agent": "claude-code",
          "scope": "global",
          "path": "~/.claude/mcp.json"
        }
      ],
      "metadata": {
        "command": "npx -y @modelcontextprotocol/server-sqlite",
        "npmPackage": "@modelcontextprotocol/server-sqlite"
      }
    }
  },

  "sources": {
    "vercel-labs/agent-skills": {
      "lastChecked": "2026-02-04T15:00:00Z",
      "availableUpdates": {}
    }
  }
}
````

**Key Changes in v2:**

- Added `config.preferredAgents` for default agent targeting
- Added `plugins` section to track installed plugins
- Added `handler` field to resources (indicates "built-in" or plugin ID)
- Skills include `sourcePath`, `categories`, and `namingStrategy`
- Plugin resources store agent-specific metadata in `metadata` field

### 5. Plugin System

coding-agent-fabric supports plugins for both **bundled resource types** (hooks, MCP servers) and **custom resource types** (user-defined or third-party).

**Bundled Plugins** (shipped with coding-agent-fabric):

- Hooks plugins (Claude Code, Cursor, Gemini CLI)
- MCP Servers plugin

**Third-Party Plugins** (installed separately):

- Custom resource types beyond skills and subagents
- Experimental or organization-specific resources

#### Plugin Structure

```text
.coding-agent-fabric/
  plugins/
    my-custom-resource/
      plugin.json           # Plugin manifest
      handler.js            # ResourceHandler implementation
      README.md             # Plugin documentation
```

#### Plugin Manifest

```json
{
  "id": "my-custom-resource",
  "version": "1.0.0",
  "name": "Custom Resource Plugin",
  "description": "Manages custom resources for my organization",
  "author": "Your Name",
  "resourceType": "custom-configs",
  "entry": "./handler.js",
  "requiredAgents": ["claude-code", "cursor"],
  "dependencies": {}
}
```

#### Plugin Handler

```javascript
// handler.js
export default class CustomResourceHandler {
  type = 'custom-configs';
  displayName = 'Custom Configs';

  async discover(source) {
    // Custom discovery logic
  }

  async install(resource, targets, options) {
    // Custom installation logic
  }

  // ... implement other required methods
}
```

#### Plugin Installation

```bash
# Install a plugin
$ coding-agent-fabric plugin add my-org/custom-resource-plugin

Installing plugin: custom-resource-plugin
  ✓ Downloaded to .coding-agent-fabric/plugins/custom-resource-plugin/
  ✓ Loaded handler for resource type "custom-configs"

New command available: coding-agent-fabric custom-configs <action>

# Use the plugin
$ coding-agent-fabric custom-configs add my-org/configs
```

### 6. Agent Registry

Reuse and extend the agent registry from the skills CLI.

**Note:** Core handlers (skills, subagents) use the agent registry directly. Plugin handlers may have agent-specific logic.

```typescript
interface AgentConfig {
  name: string;
  displayName: string;

  // Resource-specific directories
  skillsDir: string;
  globalSkillsDir?: string;
  hooksDir?: string;
  globalHooksDir?: string;
  subagentsDir?: string;
  globalSubagentsDir?: string;
  mcpConfigFile?: string;
  globalMcpConfigFile?: string;

  // Detection
  detectInstalled: () => Promise<boolean>;
}

const AGENT_REGISTRY: Record<AgentType, AgentConfig> = {
  'claude-code': {
    name: 'claude-code',
    displayName: 'Claude Code',
    skillsDir: '.claude/skills',
    globalSkillsDir: '~/.claude/skills',
    hooksDir: '.claude/hooks',
    globalHooksDir: '~/.claude/hooks',
    subagentsDir: '.claude/subagents',
    globalSubagentsDir: '~/.claude/subagents',
    mcpConfigFile: '.claude/mcp.json',
    globalMcpConfigFile: '~/.claude/mcp.json',
    detectInstalled: async () => {
      // Check for ~/.claude directory or `claude` binary
    },
  },
  cursor: {
    name: 'cursor',
    displayName: 'Cursor',
    skillsDir: '.cursor/skills',
    globalSkillsDir: '~/.cursor/skills',
    hooksDir: '.cursor/hooks',
    globalHooksDir: '~/.cursor/hooks',
    // Cursor may not support subagents or MCP yet
    detectInstalled: async () => {
      // Check for Cursor app or ~/.cursor directory
    },
  },
  // ... 37 more agents
};
```

### 7. Source Parser

Extend the source parser from skills CLI to support additional source types:

```typescript
interface ParsedSource {
  type: 'github' | 'gitlab' | 'npm' | 'local' | 'http' | 'registry';
  url: string;
  owner?: string;
  repo?: string;
  ref?: string; // Branch, tag, or commit
  subpath?: string;
  localPath?: string;
  npmPackage?: string;
  registryId?: string;
}

function parseSource(input: string): ParsedSource {
  // GitHub shorthand: "owner/repo"
  // GitHub URL: "https://github.com/owner/repo"
  // npm package: "npm:package-name" or "@scope/package"
  // Local path: "./path" or "/absolute/path"
  // HTTP URL: "https://example.com/resource.json"
  // Registry: "registry:resource-id"
}
```

---

## Implementation Plan

### Phase 1: Core Foundation (Months 1-3)

**Goal:** Launch MVP with core resource types (skills, subagents), plugin infrastructure, and bundled plugins

#### Milestone 1.1: Project Setup (Week 1-2)

- Initialize new repository: `coding-agent-fabric`
- Set up pnpm workspace structure (`packages/cli`, `packages/core`, `packages/common`)
- Set up TypeScript build system (ESBuild or Rollup)
- Configure testing framework (Vitest)
- Set up CI/CD (GitHub Actions)
- Create initial package.json and bin/coding-agent-fabric executable
- Copy and refactor agent registry from skills CLI into `packages/core`

#### Milestone 1.2: Core System Layer (Week 3-5)

- Implement `ResourceHandler` interface in `packages/plugin-api`
- Implement core system logic in `packages/core` (SourceParser, LockManager, Installer)
- Add `isCore` flag to distinguish built-in vs. plugin handlers
- Build `SourceParser` (GitHub, local paths initially)
- Create `LockManager` with v2 lock file schema (includes plugin tracking)
- Implement `Installer` with symlink/copy/flatten modes
- Build `Discovery` system (nested directory support, category extraction)
- Implement naming strategies (smart-disambiguation, full-path-prefix, etc.)

#### Milestone 1.3: Skills Handler (Week 6-7)

- Implement `SkillsHandler` (discover, install, remove, list)
- Port and refactor skills discovery logic from skills CLI
- Add SKILL.md parsing with frontmatter validation
- Implement nested directory discovery with category extraction
- Apply configurable naming strategies for conflict resolution
- Write tests for skills installation across multiple agents

#### Milestone 1.4: Subagents Handler (Week 8-9)

- Implement `SubagentsHandler`
- Support multiple subagent formats (Claude Code YAML + coding-agent-fabric JSON)
- Add format conversion logic for target agents
- Validate subagent config (required fields, valid model names)
- Test subagent installation for Claude Code

#### Milestone 1.5: Plugin Infrastructure (Week 10-11)

- Design plugin manifest schema (plugin.json)
- Implement plugin loading system
- Add plugin discovery (`.coding-agent-fabric/plugins/` with global fallback)
- Create `PluginManager` class for registration and lifecycle
- Implement error handling for missing plugins
- Add `coding-agent-fabric plugin list/remove` commands

#### Milestone 1.6: Bundled Plugins (Week 12-14)

- Build `@coding-agent-fabric/plugin-claude-code-hooks` (Claude Code hooks plugin)
- Build `@coding-agent-fabric/plugin-cursor-hooks` (Cursor hooks plugin)
- Build `@coding-agent-fabric/plugin-gemini-cli-hooks` (Gemini CLI hooks plugin)
- Build `@coding-agent-fabric/plugin-mcp` (MCP servers plugin)
- Bundle plugins with coding-agent-fabric distribution
- Test plugin loading and resource management

#### Milestone 1.7: CLI & UX (Week 15)

- Build command router with core + plugin command dispatch
- Implement interactive prompts (agent selection, resource selection, naming strategy)
- Add progress indicators and error handling
- Show clear errors when required plugin missing
- Create help documentation and examples

#### Milestone 1.8: Beta Testing & Launch (Week 16)

- Internal dogfooding on coding-agent-fabric team projects
- Fix critical bugs
- Performance optimization
- Documentation review
- Publish to npm as `coding-agent-fabric` package
- Announce on social media and forums

### Phase 2: Plugin Ecosystem & Discovery (Months 4-5)

#### Milestone 2.1: Third-Party Plugin Support (Week 17-18)

- Implement `coding-agent-fabric plugin add` for third-party plugins (GitHub, npm)
- Build plugin template generator (`coding-agent-fabric init-plugin`)
- Create plugin development documentation
- Publish example third-party plugin

#### Milestone 2.2: Granular Management Features (Week 19-20)

- Implement preferred agents configuration
- Add update history tracking in lock file (configurable limit)
- Build rollback commands (`coding-agent-fabric skills rollback <name>`)
- Add source-based updates (`coding-agent-fabric update --source owner/repo`)
- Implement agent syncing (`coding-agent-fabric sync --to <agent>`)

#### Milestone 2.3: Registry Integration (Week 21-22)

- Integrate with existing skills.sh registry
- Add `coding-agent-fabric find` for cross-resource search
- Support npm registry for plugin discovery
- Add well-known endpoints support

#### Milestone 2.4: Dependencies & Validation (Week 23-24)

- Implement resource dependency resolution
- Add `coding-agent-fabric doctor` for health checks
- Validate agent compatibility before installation
- Add conflict detection for plugin resources

### Phase 3: Ecosystem & Growth (Months 6-7)

#### Milestone 3.1: coding-agent-fabric Registry (Week 25-28)

- Build centralized registry service (API + web UI)
- Support resource discovery (skills, subagents)
- Add plugin marketplace for third-party plugins
- Allow community submissions with moderation
- Add search, filtering, and popularity metrics

#### Milestone 3.2: Advanced Features (Week 29-32)

- Resource versioning with semver constraints
- Automated update notifications (daily checks, respect `DISABLE_UPDATE_CHECK`)
- Resource health monitoring (broken links, deprecated resources)
- Resource bundles (install multiple resources at once)

#### Milestone 3.3: Community & Documentation (Week 33-36)

- Write comprehensive documentation site
  - Core concepts (skills, subagents)
  - Plugin development guide
  - Nested directory and naming strategies
  - Granular management features
- Create video tutorials
- Launch community Discord/Slack
- Organize hackathon for resource creation

#### Milestone 3.4: Partnerships & Integration (Week 37-40)

- Partner with agent creators (Claude, Cursor, Gemini, etc.) for official endorsement
- Integrate with agent marketplaces and plugin stores
- Collaborate with skills.sh, Vercel, and other ecosystem players
- Promote community-contributed plugins

---

## Migration from Skills CLI

### For Users

**coding-agent-fabric is a new tool, not an upgrade of the `skills` CLI.**

Users currently using `skills` CLI can continue using it. coding-agent-fabric is designed to eventually replace it but doesn't require migration.

#### Gradual Adoption Path

1. **Install coding-agent-fabric alongside skills CLI**

```bash
 npx coding-agent-fabric --version  # Verify installation
 npx skills --version   # Still works
```

2. **Try coding-agent-fabric for new resources**

```bash
 # Use coding-agent-fabric for new installations
 coding-agent-fabric skills add new-skill

 # Existing skills CLI installations still work
 npx skills list
```

3. **Optional: Migrate existing skills**

```bash
 # coding-agent-fabric can auto-detect skills installed by skills CLI
 coding-agent-fabric import-from-skills

 # This will:
 # - Scan existing .agents/skills/
 # - Add entries to .coding-agent-fabric/lock.json
 # - Preserve symlinks
```

4. **Eventually deprecate skills CLI**

- After 6-12 months, recommend users fully migrate
- `skills` CLI will enter maintenance mode

### For Repository Owners

**No changes required.** Resources using the current SKILL.md format will work in coding-agent-fabric automatically.

#### To Support Multiple Resource Types

```text
your-repo/
  skills/
    my-skill/
      SKILL.md
  hooks/
    pre-commit/
      hook.js
      hook.json  # Metadata
  subagents/
    code-reviewer/
      subagent.json
```

Users can install specific resource types:

```bash
coding-agent-fabric skills add your-org/your-repo
coding-agent-fabric hooks add your-org/your-repo
```

---

## Open Questions

### 1. Lock File Merge Conflicts

**Issue:** In team environments, `.coding-agent-fabric/lock.json` may cause merge conflicts if two developers install different resources.

**Options:**

- A) Document best practices (always pull before installing)
- B) Build smart merge tool (`coding-agent-fabric merge-lock`)
- C) Use per-developer lock files (`.coding-agent-fabric/lock.<username>.json`)

**Decision:** Start with (A), implement (B) if merge conflicts become a common pain point.

### 2. Resource Namespacing

**Issue:** What if two repositories have a resource with the same name?

**Example:**

- `org-a/skills` has `frontend-design`
- `org-b/skills` also has `frontend-design`

**Options:**

- A) Use source-qualified names: `org-a/frontend-design`, `org-b/frontend-design`
- B) Last install wins (overwrite)
- C) Force user to resolve conflicts manually

**Decision:** (A) is safest. Use `<source>/<name>` format in lock file. Display name can be short (`frontend-design`) but internal ID is fully qualified.

### 3. MCP Server Installation

**Issue:** Should coding-agent-fabric install npm dependencies for MCP servers automatically?

**Example:** Installing `mcp-server-sqlite` requires `npm install @modelcontextprotocol/server-sqlite`

**Options:**

- A) Auto-install npm packages (run `npm install` in background)
- B) Require users to install dependencies manually
- C) Use `npx` to run MCP servers without local installation

**Decision:** Start with (C) - use `npx -y` in MCP config. Avoids npm permission issues and keeps coding-agent-fabric lightweight.

### 4. Hook Security

**Issue:** Hooks execute arbitrary code. How to prevent malicious hooks?

**Security Measures:**

- Scan hook source code for dangerous patterns (eval, exec, file system access)
- Require user confirmation before installing hooks
- Sandbox hook execution (if feasible)
- Community reporting for malicious resources

**Decision:** Implement static analysis + user confirmation. Full sandboxing is complex and may limit hook capabilities.

**Note:** Since hooks are now managed by agent-specific plugins, security measures are implemented per-plugin with agent-specific rules.

### 5. Cross-Agent Compatibility Testing

**Issue:** With 39+ agents, how to ensure resources work across all of them?

**Options:**

- A) Manual testing on subset of popular agents (Claude Code, Cursor, Codex)
- B) Automated testing in CI with Docker containers for each agent
- C) Community-reported compatibility matrix

**Decision:** Combination of (A) and (C). Core team tests on 3-5 major agents, community reports compatibility for others.

**Note:** Core resources (skills, subagents) require broad compatibility. Plugin resources (hooks, MCP) are agent-specific by design.

### 6. Update Notification Frequency

**Issue:** How often should coding-agent-fabric check for updates?

**Options:**

- A) On every command (may slow down CLI)
- B) Once per day (cache check result)
- C) Manual only (`coding-agent-fabric check`)

**Decision:** (B) - Check once per day in background, show notification on next CLI invocation. Respect `DISABLE_UPDATE_CHECK` env variable.

---

## Success Metrics

### Success Metrics: Phase 1 (MVP)

- 1,000+ installs
- 50+ resources published (across all types)
- Support for 20+ agents (tested and verified)
- 90%+ user satisfaction (survey)

### Success Metrics: Phase 2 (Extensibility)

- 5,000+ installs
- 200+ resources published
- 5+ community plugins
- 80% of users use multiple resource types

### Success Metrics: Phase 3 (Ecosystem)

- 10,000+ installs
- 500+ resources published
- 20+ community plugins
- Official endorsement from 2+ agent creators

---

## Appendix: Resource Type Specifications

### A. Skills

**File Structure:**

```text
skills/
  my-skill/
    SKILL.md        # Required
    assets/         # Optional
      example.png
```

**SKILL.md Format:**

```markdown
---
name: my-skill
description: What this skill does
metadata:
  internal: false # Optional: hide from discovery
  tags: [frontend, react]
  version: 1.0.0
---

# My Skill

Instructions for the agent...
```

### B. Hooks

**File Structure:**

```text
hooks/
  pre-commit/
    hook.json       # Metadata
    hook.js         # Implementation (or hook.sh, hook.py)
```

**hook.json Format:**

```json
{
  "name": "pre-commit-linter",
  "event": "pre-commit",
  "description": "Runs ESLint before commits",
  "runtime": "node",
  "entry": "./hook.js",
  "timeout": 30000,
  "dependencies": {
    "eslint": "^8.0.0"
  }
}
```

### C. Subagents

**File Structure:**

```text
subagents/
  code-reviewer/
    subagent.json   # Configuration
    README.md       # Optional
```

**subagent.json Format:**

```json
{
  "name": "code-reviewer",
  "description": "Specialized agent for code reviews",
  "model": "claude-sonnet-4",
  "systemPrompt": "You are an expert code reviewer...",
  "tools": ["read", "grep", "bash"],
  "maxTurns": 10,
  "temperature": 0.7
}
```

### D. MCP Servers

**File Structure:**

```text
mcp/
  my-server/
    mcp-server.json  # Configuration
    package.json     # If npm package
```

**mcp-server.json Format:**

```json
{
  "name": "mcp-server-sqlite",
  "description": "SQLite database access via MCP",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-sqlite"],
  "env": {
    "DB_PATH": "./database.db"
  },
  "npmPackage": "@modelcontextprotocol/server-sqlite"
}
```
