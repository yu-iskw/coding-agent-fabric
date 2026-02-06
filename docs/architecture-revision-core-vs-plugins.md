# coding-agent-fabric Architecture Revision: Core vs. Plugins

**Date:** 2026-02-04
**Status:** Architecture Decision
**Related:** Main Design Document (`design_docs.md`), Granular Management Addendum (`design-addendum-granular-management.md`)

---

## Executive Summary

Based on analysis of hook specifications across different agents (Claude Code, Cursor, Gemini CLI), we are **revising the core architecture** to support:

**Core (Built-in):**

- ✅ **Skills** - Consistent format across all agents (SKILL.md with YAML frontmatter)
- ✅ **Subagents** - Emerging standard, supported by Claude Code and growing
- ✅ **Rules** - Proactive context steering (.cursorrules, .clauderules)

**Plugins (Agent-Specific):**

- 🔌 **Hooks** - Highly agent-specific JSON schemas and execution models
- 🔌 **MCP Servers** - Growing ecosystem but installation varies by agent
- 🔌 **Custom Resources** - User-defined or experimental types

---

## Rationale: Why Hooks Belong in Plugins

### Hooks Have Divergent Specifications

Analysis of hook documentation reveals **fundamentally incompatible formats**:

#### Claude Code Hooks

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/block-rm.sh",
            "timeout": 600,
            "async": false
          }
        ]
      }
    ]
  }
}
```

**Key Features:**

- 12+ hook events (`PreToolUse`, `PostToolUse`, `Stop`, `SessionStart`, etc.)
- Matcher patterns (regex-based filtering)
- Three hook types: `command`, `prompt`, `agent`
- JSON stdin/stdout communication
- Exit code semantics (0 = allow, 2 = deny)
- Async execution support
- Hooks in skills/agents frontmatter

#### Cursor Hooks

```json
{
  "version": 1,
  "hooks": {
    "hookName": [
      {
        "command": "path/to/script",
        "type": "command",
        "matcher": "pattern",
        "loop_limit": 10
      }
    ]
  }
}
```

**Key Features:**

- Different event names than Claude Code
- Versioned schema (`version: 1`)
- `loop_limit` for iterative hooks
- Enterprise/user/project scope hierarchy
- Fail-open by default (non-zero exit = permit)

#### Gemini CLI Hooks

```json
{
  "hooks": {
    "EventName": [
      {
        "matcher": "pattern",
        "hooks": [
          {
            "name": "hook-name",
            "type": "command",
            "command": "path/to/script.sh",
            "timeout": 5000
          }
        ]
      }
    ]
  }
}
```

**Key Features:**

- Nested matcher groups
- Strict JSON stdout requirement ("no plain text")
- Exit code 2 = critical blocking (stops everything)
- Multi-level settings files (project, user, system, extensions)
- Synchronous by default (blocks CLI)

### Key Incompatibilities

| Aspect              | Claude Code                  | Cursor                 | Gemini CLI                        |
| ------------------- | ---------------------------- | ---------------------- | --------------------------------- |
| **Event Names**     | `PreToolUse`, `Stop`         | Different set          | `EventName` (varies)              |
| **Exit Code 2**     | Deny/block action            | Deny/block action      | **Critical blocking** (stops CLI) |
| **Exit Code Non-0** | Fail-open                    | **Fail-open (permit)** | Error shown                       |
| **Async Support**   | `async: true`                | Not documented         | Not supported                     |
| **JSON Format**     | Optional (exit codes work)   | Required for decisions | **Strict** (no plain text)        |
| **Hook Types**      | `command`, `prompt`, `agent` | `command`, `prompt`    | `command` only                    |
| **Versioning**      | No schema version            | `version: 1`           | No schema version                 |
| **Location**        | `.claude/settings.json`      | `.cursor/hooks.json`   | `.gemini/settings.json`           |

### Implications

**If hooks were core coding-agent-fabric features:**

- ❌ Need to support 3+ incompatible JSON schemas
- ❌ Different exit code semantics (fail-open vs. fail-closed)
- ❌ Different event lifecycles and naming
- ❌ Complex translation layer for each agent
- ❌ Brittle as agents evolve their hook specs
- ❌ Can't leverage agent-specific features (e.g., Claude Code's `prompt` hooks)

**If hooks are plugins:**

- ✅ Each plugin implements agent-specific logic
- ✅ No cross-agent compatibility burden on core
- ✅ Plugins can evolve with agent specifications
- ✅ Users install only the plugins for their agents
- ✅ Community can contribute plugins for niche agents

---

## Revised Architecture

### Core Built-In Resource Types

#### 1. Skills

**Rationale:**

- Consistent format across ALL 39+ agents (SKILL.md with YAML frontmatter)
- Core to the AgentSkills specification (<https://agentskills.io>)
- Already proven in `skills` CLI with 1k+ installs
- No agent-specific quirks

**coding-agent-fabric Responsibility:**

- Discovery (nested directory support, category extraction)
- Installation (flattening, name conflict resolution)
- Updates (source tracking, version history)
- Cross-agent compatibility (works everywhere)

#### 2. Subagents

**Rationale:**

- Emerging standard in the agent ecosystem
- Claude Code has native support (Task tool with subagent types)
- Logical grouping with skills (both are "instructions")
- Simpler than hooks (no event lifecycle, just configuration)

**coding-agent-fabric Responsibility:**

- Discover subagent.json or subagent.yaml files
- Install to agent-specific directories (e.g., `.claude/agents/`)
- Track versions and updates
- Validate configuration (required fields, model names)

#### 3. Rules

**Rationale:**

- Critical for agent steering and context management
- Consistent markdown-based format across major agents (Cursor, Claude Code, Codex)
- High demand for shared "best practice" rulesets
- Simple file-based distribution (like skills)

**coding-agent-fabric Responsibility:**

- Discover `*.md` and `*.mdc` files
- Extract glob patterns from frontmatter
- Map to agent-specific extensions (.mdc for Cursor, .md for others)
- Handle project and global scoping

**Subagent Format (Proposed Standard):**

```json
{
  "name": "code-reviewer",
  "description": "Specialized agent for code reviews",
  "model": "claude-sonnet-4",
  "systemPrompt": "You are an expert code reviewer...",
  "tools": ["Read", "Grep", "Bash"],
  "maxTurns": 10,
  "temperature": 0.7
}
```

### Plugin Resource Types

#### 3. Hooks (via Plugins)

**Why Plugins:**

- Agent-specific JSON schemas (incompatible across agents)
- Different event lifecycles and semantics
- Rapidly evolving specifications
- Not all agents support hooks

**Plugin Architecture:**

- `@coding-agent-fabric/plugin-claude-code-hooks` - Handles Claude Code hooks
- `@coding-agent-fabric/plugin-cursor-hooks` - Handles Cursor hooks
- `coding-agent-fabric-plugin-gemini-cli-hooks` - Handles Gemini CLI hooks

**Plugin Responsibilities:**

- Parse agent-specific hook format
- Validate hook configuration
- Install hooks to correct locations (`.claude/settings.json` vs. `.cursor/hooks.json`)
- Handle agent-specific update mechanisms

**User Experience:**

```bash
# Install hooks plugin for Claude Code
coding-agent-fabric plugin add @coding-agent-fabric/plugin-claude-code-hooks

# Now hooks commands are available
coding-agent-fabric hooks add my-org/linters --agent claude-code

# For Cursor users
coding-agent-fabric plugin add @coding-agent-fabric/plugin-cursor-hooks
coding-agent-fabric hooks add my-org/linters --agent cursor
```

#### 4. MCP Servers (via Plugins)

**Why Plugins:**

- Installation varies by agent (npm packages, binaries, config files)
- Configuration format differs (JSON, YAML, agent-specific)
- Growing ecosystem but not standardized
- Complex dependencies (npm, Python, system tools)

**Plugin:**

- `@coding-agent-fabric/plugin-mcp` - Handles MCP server installation

#### 5. Custom Resources (via Plugin API)

**Why Plugins:**

- Unlimited diversity in future resource types
- Experimental or org-specific resources
- Community-driven innovation

---

## Updated Core Architecture

### Simplified Core Responsibilities

```text
┌─────────────────────────────────────────────────────────────┐
│                         coding-agent-fabric Core                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Built-In Resource Handlers                 │  │
│  │  ┌──────────┐         ┌──────────┐                   │  │
│  │  │  Skills  │         │ Subagents│                   │  │
│  │  │ Handler  │         │ Handler  │                   │  │
│  │  └──────────┘         └──────────┘                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Core System Services                       │  │
│  │  - Agent Registry (39+ agents)                       │  │
│  │  - Source Parser (GitHub, local, npm, http)          │  │
│  │  - Lock Manager (version tracking)                   │  │
│  │  - Installer (symlink/copy, flattening)              │  │
│  │  - Discovery (nested directories, categories)        │  │
│  │  - Plugin Manager (load/register plugins)            │  │
│  │  - Telemetry                                          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    Plugin Ecosystem                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │ Claude Code Hooks   │  │  Cursor Hooks       │          │
│  │ Plugin              │  │  Plugin             │          │
│  └─────────────────────┘  └─────────────────────┘          │
│                                                              │
│  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │ Gemini CLI Hooks    │  │  MCP Servers        │          │
│  │ Plugin              │  │  Plugin             │          │
│  └─────────────────────┘  └─────────────────────┘          │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         Custom Plugins (community-contributed)       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Plugin Interface (Extended)

```typescript
interface ResourceHandler {
  // Metadata
  readonly type: string; // "skills", "subagents", "hooks", "mcp", etc.
  readonly displayName: string;
  readonly description: string;
  readonly isCore: boolean; // true for built-in, false for plugins

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

### Example: Claude Code Hooks Plugin

**Directory Structure (Workspace):**

```text
packages/plugins/claude-code-hooks/
  package.json         # Package manifest
  plugin.json          # Plugin manifest
  handler.ts           # ResourceHandler implementation
  schemas/
    settings.schema.json  # JSON schema for Claude Code hooks
  README.md
```

**Plugin Manifest (`plugin.json`):**

```json
{
  "id": "claude-code-hooks",
  "name": "@coding-agent-fabric/plugin-claude-code-hooks",
  "version": "1.0.0",
  "description": "Manage hooks for Claude Code",
  "author": "coding-agent-fabric Team",
  "resourceType": "hooks",
  "supportedAgents": ["claude-code"],
  "entry": "./handler.js",
  "dependencies": {}
}
```

**Handler Implementation (simplified):**

```typescript
export default class ClaudeCodeHooksHandler implements ResourceHandler {
  type = 'hooks';
  displayName = 'Hooks (Claude Code)';
  isCore = false;

  async discover(source: ParsedSource): Promise<Resource[]> {
    // Scan for hook files (*.sh, *.js, *.py)
    // Look for hook.json or hooks.json metadata
    // Parse according to Claude Code spec
    // Return array of Hook resources
  }

  async install(hook: Resource, targets: InstallTarget[], options: InstallOptions): Promise<void> {
    // 1. Validate hook configuration against Claude Code schema
    // 2. Copy hook scripts to .claude/hooks/
    // 3. Update .claude/settings.json with hook configuration
    // 4. Validate JSON syntax and hook event names
  }

  getSupportedAgents(): AgentType[] {
    return ['claude-code'];
  }

  getInstallPath(agent: AgentType, scope: 'global' | 'project'): string {
    if (agent !== 'claude-code') {
      throw new Error('This plugin only supports Claude Code');
    }
    return scope === 'global' ? '~/.claude/settings.json' : '.claude/settings.json';
  }
}
```

---

## CLI Experience

### Core Commands (Skills and Subagents)

```bash
# Skills (core feature)
coding-agent-fabric skills add vercel-labs/agent-skills
coding-agent-fabric skills list
coding-agent-fabric skills update frontend-design
coding-agent-fabric skills remove old-skill

# Subagents (core feature)
coding-agent-fabric subagents add openai/code-reviewer
coding-agent-fabric subagents list
coding-agent-fabric subagents update code-reviewer
```

### Plugin Commands (Hooks, MCP, etc.)

```bash
# Install hooks plugin for your agent
coding-agent-fabric plugin add @coding-agent-fabric/plugin-claude-code-hooks

# Now hooks commands are available
coding-agent-fabric hooks add my-org/linters
coding-agent-fabric hooks list
coding-agent-fabric hooks update pre-commit

# For Cursor users
coding-agent-fabric plugin add @coding-agent-fabric/plugin-cursor-hooks
coding-agent-fabric hooks add my-org/linters --agent cursor

# MCP servers (via plugin)
coding-agent-fabric plugin add @coding-agent-fabric/plugin-mcp
coding-agent-fabric mcp add mcp-server-sqlite
coding-agent-fabric mcp list
```

### Plugin Management

```bash
# List available plugins
coding-agent-fabric plugin search

# Install plugin
coding-agent-fabric plugin add @coding-agent-fabric/plugin-claude-code-hooks

# List installed plugins
coding-agent-fabric plugin list

# Remove plugin
coding-agent-fabric plugin remove @coding-agent-fabric/plugin-claude-code-hooks

# Update all plugins
coding-agent-fabric plugin update
```

---

## Lock File Schema (Revised)

### Core + Plugins Tracking

```json
{
  "version": 2,
  "config": {
    "preferredAgents": ["claude-code", "cursor"],
    "defaultScope": "project",
    "historyLimit": 10,
    "updateStrategy": "parallel"
  },

  "plugins": {
    "@coding-agent-fabric/plugin-claude-code-hooks": {
      "version": "1.0.0",
      "installedAt": "2026-02-04T10:00:00Z",
      "enabled": true
    },
    "@coding-agent-fabric/plugin-mcp": {
      "version": "0.5.0",
      "installedAt": "2026-02-04T11:00:00Z",
      "enabled": true
    }
  },

  "resources": {
    "frontend-design": {
      "type": "skills", // Core type
      "handler": "built-in",
      "originalName": "patterns",
      "installedName": "frontend-design",
      "sourcePath": "skills/frontend/react/patterns",
      "categories": ["frontend", "react"],
      "current": {
        /* version info */
      },
      "history": [
        /* previous versions */
      ],
      "installedFor": [
        /* agents */
      ]
    },

    "pre-commit-linter": {
      "type": "hooks", // Plugin type
      "handler": "@coding-agent-fabric/plugin-claude-code-hooks", // Handled by plugin
      "source": "my-org/linters",
      "current": {
        /* version info */
      },
      "installedFor": [
        {
          "agent": "claude-code",
          "scope": "project",
          "path": ".claude/settings.json",
          "hookConfig": {
            "event": "PreToolUse",
            "matcher": "Bash"
          }
        }
      ]
    },

    "mcp-server-sqlite": {
      "type": "mcp",
      "handler": "@coding-agent-fabric/plugin-mcp",
      "npmPackage": "@modelcontextprotocol/server-sqlite",
      "current": {
        /* version info */
      },
      "installedFor": [
        /* agents */
      ]
    }
  },

  "sources": {
    /* source metadata */
  }
}
```

**Key Changes:**

- `handler` field indicates whether core ("built-in") or plugin handles the resource
- `plugins` section tracks installed plugins
- Plugin-managed resources have `handler` pointing to the plugin ID

---

## Implementation Plan (Revised)

### Phase 1: Core Foundation (Months 1-3)

**Goal:** MVP with skills and subagents as core features

#### Milestone 1.1: Project Setup (Week 1-2)

- [ ] Initialize coding-agent-fabric repository
- [ ] Set up pnpm workspace structure (`packages/cli`, `packages/core`, `packages/common`)
- [ ] Set up TypeScript build, testing, CI/CD
- [ ] Implement core system layer (agent registry, source parser, lock manager) in `packages/core`

#### Milestone 1.2: Skills Handler (Week 3-5)

- [ ] Implement skills discovery (nested directories, categories)
- [ ] Build skills installation (flattening, naming strategies)
- [ ] Add skills commands (add, list, update, remove)

#### Milestone 1.3: Subagents Handler (Week 6-8)

- [ ] Implement subagent discovery (subagent.json/yaml)
- [ ] Build subagent installation
- [ ] Add subagent commands

#### Milestone 1.4: Plugin Infrastructure (Week 9-12)

- [ ] Design `ResourceHandler` interface in `packages/plugin-api`
- [ ] Implement plugin loading and registration
- [ ] Create plugin manager commands (add, list, remove)
- [ ] Build plugin discovery (npm, GitHub, local)

### Phase 2: First-Party Plugins (Months 4-5)

#### Milestone 2.1: Claude Code Hooks Plugin (Week 13-16)

- [ ] Implement hook discovery for Claude Code
- [ ] Parse Claude Code settings.json format
- [ ] Install hooks with validation
- [ ] Test all 12 hook events

#### Milestone 2.2: Cursor Hooks Plugin (Week 17-18)

- [ ] Implement Cursor hooks.json format
- [ ] Handle version field and Cursor-specific semantics
- [ ] Test compatibility

#### Milestone 2.3: MCP Plugin (Week 19-20)

- [ ] Implement MCP server discovery
- [ ] Handle npm package installation
- [ ] Update agent MCP config files

### Phase 3: Ecosystem & Documentation (Months 6-7)

#### Milestone 3.1: Documentation (Week 21-24)

- [ ] Plugin development guide
- [ ] Skills and subagents user guide
- [ ] CLI reference documentation

#### Milestone 3.2: Community Enablement (Week 25-28)

- [ ] Plugin template generator
- [ ] Example plugins repository
- [ ] Plugin marketplace (optional)

---

## Migration Notes

### From Original Design Doc

**What Changed:**

- Hooks moved from core to plugin
- MCP moved from core to plugin
- Lock file schema updated to track plugins
- CLI commands updated (plugin-managed resources require plugin installation first)

**What Stayed the Same:**

- Skills remain core (SKILL.md format)
- Subagents remain core (subagent.json format)
- Agent registry and detection
- Source parsing and installation strategies
- Granular management features (preferred agents, update history, rollback)
- Nested directory support and naming strategies

### Backward Compatibility

**From `skills` CLI:**

- Skills format unchanged (SKILL.md with YAML frontmatter)
- Installation paths unchanged
- Lock file migration utility provided

**For Early Adopters:**

- If hooks were installed via pre-1.0 coding-agent-fabric, migration guide will show how to install relevant plugin
- Lock file automatically updated to reflect plugin handlers

---

## Benefits of This Architecture

### For Users

✅ **Simpler Core:**

- Only learn skills and subagents initially
- Install plugins only for needed features

✅ **Agent-Specific Optimizations:**

- Hooks plugins leverage agent-specific features
- No compromises for cross-agent compatibility

✅ **Faster Iteration:**

- Plugins update independently of core
- Bug fixes in hook handling don't require core update

### For Developers

✅ **Clear Boundaries:**

- Core focuses on universal resource types
- Plugins handle agent-specific complexity

✅ **Easier Testing:**

- Core has fewer integration points
- Plugins test against specific agent versions

✅ **Community Contributions:**

- Lower barrier to add new resource types
- Plugins don't need core approval/merge

### For the Ecosystem

✅ **Standardization Where It Matters:**

- Skills and subagents can become de facto standards
- Hooks remain agent-specific (as they should be)

✅ **Extensibility:**

- New resource types (e.g., "prompts", "templates") can start as plugins
- Proven plugins can graduate to core if universally adopted

---

## Open Questions

### 1. Plugin Distribution

**Question:** How are plugins distributed and discovered?

**Options:**

- A) npm packages (e.g., `npm install @coding-agent-fabric/plugin-claude-code-hooks`)
- B) GitHub repositories (e.g., `coding-agent-fabric plugin add anthropics/claude-hooks-plugin`)
- C) Plugin registry (centralized, like skills.sh)

**Recommendation:** Start with (A) npm packages for first-party plugins, add (B) GitHub support later, (C) registry for discovery only.

### 2. Plugin Versioning

**Question:** How do plugin versions relate to agent versions?

**Example:** Claude Code hooks schema changes in v2.0

**Options:**

- A) Plugin declares supported agent versions in manifest
- B) Multiple plugin versions, user chooses (e.g., `@coding-agent-fabric/plugin-claude-code-hooks@1.x` for Claude Code 1.x)
- C) Plugin auto-detects agent version and adapts

**Recommendation:** (A) + (B) - Plugin declares compatibility range, users can pin versions if needed.

### 3. Plugin Conflicts

**Question:** What if two plugins both try to handle the same resource type?

**Example:** `coding-agent-fabric-plugin-claude-hooks` and `@community/better-claude-hooks`

**Options:**

- A) Last installed wins
- B) User configures priority
- C) Error, require user to uninstall one

**Recommendation:** (C) - Explicit error, require user choice. Prevent silent conflicts.

---

## Conclusion

### End of Architecture Revision
