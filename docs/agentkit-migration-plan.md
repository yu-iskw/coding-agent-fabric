# AgentKit Migration Plan

## Executive Summary

This document provides a comprehensive, actionable plan for rebranding **coding-agent-fabric** to **AgentKit**, inspired by SkillKit's positioning while maintaining our differentiators: plugin-first architecture and broader resource abstractions.

**Migration Goals:**
1. Rebrand product identity (name, messaging, positioning)
2. Migrate NPM scope from `@coding-agent-fabric/*` to `@agentkit/*`
3. Introduce CLI compatibility layer (`caf` → `agentkit`)
4. Refactor core architecture to support canonical resource model + renderers
5. Ship MCP-first discovery
6. Maintain backward compatibility

## Current State Analysis

### Package Structure

```
coding-agent-fabric/
├── packages/
│   ├── cli/                    (@coding-agent-fabric/cli)
│   ├── core/                   (@coding-agent-fabric/core)
│   ├── common/                 (@coding-agent-fabric/common)
│   ├── plugin-api/             (@coding-agent-fabric/plugin-api)
│   └── plugins/
│       ├── claude-code-hooks/  (@coding-agent-fabric/plugin-claude-code-hooks)
│       ├── cursor-hooks/       (@coding-agent-fabric/plugin-cursor-hooks)
│       └── mcp/                (@coding-agent-fabric/plugin-mcp)
```

### CLI Command Surface

**Current binaries:**
- `caf` (primary)
- `coding-agent-fabric` (alias)

**Command structure:**
```bash
caf rules <add|list|remove|update>
caf skills <add|list|remove|update>
caf subagents <add|list|remove|update>
caf plugin <add|list|remove>
caf doctor
caf check
caf update
```

### Key Files Requiring Changes

| Category | Files | Change Type |
|----------|-------|-------------|
| **Package Metadata** | All `package.json` files (8 total) | NPM scope, name, description |
| **Source Code** | All `.ts` files importing `@coding-agent-fabric/*` (55+ files) | Import path updates |
| **CLI Entry** | `packages/cli/src/cli.ts` | Program name, description |
| **Documentation** | README.md, CONTRIBUTING.md, CLAUDE.md, package READMEs | Brand, examples, links |
| **Configuration** | `.claude/skills/*.md`, plugin manifests | References |

## Migration Phases

### Phase A: Brand & Messaging (Non-Breaking)

**Goal:** Update all user-facing messaging without breaking existing functionality.

**Tasks:**

1. **Root README.md**
   - Change: `# coding-agent-fabric` → `# AgentKit`
   - Update tagline: "universal CLI for managing AI coding-agent resources" → "universal control plane for coding agents: skills + resources + discovery"
   - Update installation examples to reference `@agentkit/cli` (with note about migration)
   - Update all CLI examples: `caf` → `agentkit` (keeping `caf` as deprecated alias)
   - Add migration notice banner

2. **CLAUDE.md**
   - Update project overview section
   - Update package table
   - Update command examples

3. **CONTRIBUTING.md**
   - Update references to project name
   - Update package setup instructions

4. **Package READMEs** (7 files)
   - Update package descriptions
   - Update cross-references

5. **Documentation files**
   - `docs/design_docs.md`
   - `docs/architecture-revision-core-vs-plugins.md`
   - New: `docs/agentkit-vision.md` (positioning doc)
   - New: `docs/migration-from-caf.md` (user migration guide)

**Success Criteria:**
- ✅ All documentation references AgentKit as primary name
- ✅ `coding-agent-fabric` mentioned only in compatibility/migration contexts
- ✅ No code changes yet

---

### Phase B: Package Migration (@agentkit/*)

**Goal:** Migrate NPM scope while maintaining backward compatibility.

#### B1: Package.json Updates

**File-by-file changes:**

1. **Root package.json**
   ```json
   {
     "name": "agentkit",
     "description": "Universal control plane for coding agents.",
     "keywords": ["ai", "coding-agents", "skills", "agentkit", "mcp"]
   }
   ```

2. **packages/cli/package.json**
   ```json
   {
     "name": "@agentkit/cli",
     "description": "Command-line interface for AgentKit",
     "keywords": ["agentkit", "cli", "ai", "agents", "skills"],
     "bin": {
       "agentkit": "./dist/cli.js",
       "ak": "./dist/cli.js",
       "caf": "./dist/compat-caf.js"  // NEW: compatibility wrapper
     },
     "dependencies": {
       "@agentkit/common": "workspace:*",
       "@agentkit/core": "workspace:*",
       ...
     }
   }
   ```

3. **packages/core/package.json**
   ```json
   {
     "name": "@agentkit/core",
     "description": "Core logic for AgentKit: ResourceRegistry, renderers, handlers",
     "keywords": ["agentkit", "core", "resources", "renderers"],
     "dependencies": {
       "@agentkit/common": "workspace:*",
       "@agentkit/plugin-api": "workspace:*",
       ...
     }
   }
   ```

4. **packages/common/package.json**
   ```json
   {
     "name": "@agentkit/common",
     "description": "Shared types and utilities for AgentKit",
     "keywords": ["agentkit", "types", "utilities"]
   }
   ```

5. **packages/plugin-api/package.json**
   ```json
   {
     "name": "@agentkit/plugin-api",
     "description": "API for building AgentKit plugins",
     "keywords": ["agentkit", "plugin-api", "extensions"]
   }
   ```

6. **packages/plugins/claude-code-hooks/package.json**
   ```json
   {
     "name": "@agentkit/plugin-claude-hooks",
     "description": "AgentKit plugin for Claude Code hooks",
     "dependencies": {
       "@agentkit/plugin-api": "workspace:*",
       "@agentkit/common": "workspace:*"
     }
   }
   ```

7. **packages/plugins/cursor-hooks/package.json**
   ```json
   {
     "name": "@agentkit/plugin-cursor-hooks",
     "description": "AgentKit plugin for Cursor hooks",
     "dependencies": {
       "@agentkit/plugin-api": "workspace:*",
       "@agentkit/common": "workspace:*"
     }
   }
   ```

8. **packages/plugins/mcp/package.json**
   ```json
   {
     "name": "@agentkit/plugin-mcp",
     "description": "AgentKit plugin for MCP server management",
     "dependencies": {
       "@agentkit/plugin-api": "workspace:*",
       "@agentkit/common": "workspace:*"
     }
   }
   ```

#### B2: Import Path Updates

**Automated find/replace across all `.ts` files:**

```bash
# Find all TypeScript files with old imports
grep -rl "@coding-agent-fabric" packages/

# Replace:
@coding-agent-fabric/cli         → @agentkit/cli
@coding-agent-fabric/core        → @agentkit/core
@coding-agent-fabric/common      → @agentkit/common
@coding-agent-fabric/plugin-api  → @agentkit/plugin-api
@coding-agent-fabric/plugin-claude-code-hooks → @agentkit/plugin-claude-hooks
@coding-agent-fabric/plugin-cursor-hooks → @agentkit/plugin-cursor-hooks
@coding-agent-fabric/plugin-mcp  → @agentkit/plugin-mcp
```

**Affected files (~55 files):**
- All package source files
- All test files
- Plugin manifests (plugin.json files)

#### B3: Create Compatibility Wrapper

**New file:** `packages/cli/src/compat-caf.ts`

```typescript
#!/usr/bin/env node

/**
 * Backward compatibility wrapper for `caf` command
 * Redirects to `agentkit` with deprecation notice
 */

import chalk from 'chalk';

console.warn(
  chalk.yellow(
    '\n⚠️  The `caf` command is deprecated. Please use `agentkit` instead.\n' +
    '   Migration guide: https://github.com/yu-iskw/agentkit#migration\n'
  )
);

// Re-export the main CLI
import('./cli.js');
```

**Success Criteria:**
- ✅ All 8 packages renamed to `@agentkit/*`
- ✅ All import paths updated
- ✅ `caf` wrapper prints deprecation warning
- ✅ `agentkit` and `ak` work as primary commands
- ✅ `pnpm install` succeeds

---

### Phase C: CLI Command Restructuring

**Goal:** Modernize command surface while preserving backward compatibility.

#### C1: New Command Structure

**Target design:**

```bash
# New primary commands
agentkit init                    # Auto-detect agents, scaffold
agentkit add <source> [--type]   # Unified resource installation
agentkit list [--type]           # Unified listing
agentkit remove <id>             # Unified removal
agentkit sync [--agent]          # Sync canonical → agent dirs
agentkit update                  # Update all resources
agentkit doctor                  # Health check
agentkit plugin <cmd>            # Plugin management
agentkit mcp serve               # NEW: MCP discovery server
agentkit primer                  # NEW: Generate project instructions

# Backward-compatible aliases (deprecated)
agentkit skills <cmd>            # → agentkit add/list/remove --type skill
agentkit rules <cmd>             # → agentkit add/list/remove --type rule
agentkit subagents <cmd>         # → agentkit add/list/remove --type subagent
```

#### C2: CLI Implementation Changes

**File:** `packages/cli/src/cli.ts`

```typescript
#!/usr/bin/env node

import { Command } from 'commander';
import { createResourceCommand } from './commands/resource.js';  // NEW
import { createInitCommand } from './commands/init.js';  // NEW
import { createSyncCommand } from './commands/sync.js';  // NEW
import { createMcpCommand } from './commands/mcp.js';  // NEW
import { createPrimerCommand } from './commands/primer.js';  // NEW
import { createPluginCommand } from './commands/plugin.js';
import { registerSystemCommands } from './commands/system.js';

// Legacy command creators (for backward compat)
import { createSkillsCommand } from './commands/legacy/skills.js';
import { createRulesCommand } from './commands/legacy/rules.js';
import { createSubagentsCommand } from './commands/legacy/subagents.js';

const program = new Command();

program
  .name('agentkit')
  .description('Universal control plane for coding agents')
  .version('0.2.0');

// New unified commands
program.addCommand(createInitCommand());
program.addCommand(createResourceCommand());  // add/list/remove
program.addCommand(createSyncCommand());
program.addCommand(createMcpCommand());
program.addCommand(createPrimerCommand());
program.addCommand(createPluginCommand());

// Legacy commands (deprecated but functional)
const legacyWarning = (cmd: string) => {
  console.warn(
    `⚠️  'agentkit ${cmd}' is deprecated. Use 'agentkit add/list/remove --type ${cmd.slice(0, -1)}' instead.`
  );
};

const skillsCmd = createSkillsCommand();
skillsCmd.hook('preAction', () => legacyWarning('skills'));
program.addCommand(skillsCmd);

const rulesCmd = createRulesCommand();
rulesCmd.hook('preAction', () => legacyWarning('rules'));
program.addCommand(rulesCmd);

const subagentsCmd = createSubagentsCommand();
subagentsCmd.hook('preAction', () => legacyWarning('subagents'));
program.addCommand(subagentsCmd);

// System commands (doctor, check, update)
registerSystemCommands(program);

program.parse();
```

**Success Criteria:**
- ✅ `agentkit add owner/repo` works
- ✅ `agentkit skills add owner/repo` works with warning
- ✅ `caf skills add owner/repo` works with double warning
- ✅ All existing commands preserved

---

### Phase D: Core Architecture Refactor

**Goal:** Introduce canonical resource model + renderer abstraction.

#### D1: Canonical Resource Schema

**New file:** `packages/core/src/resource.ts`

```typescript
/**
 * Canonical resource model
 * All resources (skills, rules, subagents, mcp configs) normalize into this
 */

export type ResourceType = 'skill' | 'rule' | 'subagent' | 'mcp-server' | 'tool';

export interface ResourceManifest {
  id: string;                    // Unique identifier (e.g., "owner/repo/skill-name")
  type: ResourceType;
  version: string;               // Semver
  name: string;                  // Display name
  description: string;
  author?: string;
  source: ResourceSource;
  metadata: ResourceMetadata;
  content: ResourceContent;
}

export interface ResourceSource {
  type: 'git' | 'npm' | 'registry' | 'local';
  location: string;              // URL, package name, or path
  ref?: string;                  // Git ref or npm version
}

export interface ResourceMetadata {
  tags?: string[];
  category?: string;
  agents?: string[];             // Applicable agents: ['claude', 'cursor', 'codex']
  dependencies?: string[];       // Other resource IDs
  createdAt?: string;
  updatedAt?: string;
}

export interface ResourceContent {
  // Type-specific content
  skill?: SkillContent;
  rule?: RuleContent;
  subagent?: SubagentContent;
  mcpServer?: McpServerContent;
}

export interface SkillContent {
  instruction: string;           // Markdown content
  parameters?: Record<string, unknown>;
}

export interface RuleContent {
  instruction: string;           // Markdown content
  scope?: 'global' | 'project';
}

export interface SubagentContent {
  definition: unknown;           // YAML/JSON agent spec
  format: 'yaml' | 'json';
}

export interface McpServerContent {
  serverConfig: unknown;         // MCP server configuration
  tools?: ToolDefinition[];
  resources?: ResourceDefinition[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: unknown;
}

export interface ResourceDefinition {
  uri: string;
  name: string;
  description: string;
}
```

#### D2: Renderer Abstraction

**New file:** `packages/core/src/renderers/index.ts`

```typescript
/**
 * Renderer abstraction
 * Translates canonical resources → agent-specific formats
 */

import type { ResourceManifest } from '../resource.js';

export interface RenderTarget {
  agent: 'claude' | 'cursor' | 'codex';
  projectPath: string;
}

export interface RenderedOutput {
  files: RenderedFile[];
  diagnostics: Diagnostic[];
}

export interface RenderedFile {
  path: string;               // Relative to projectPath
  content: string;
  mode?: number;              // File permissions
}

export interface Diagnostic {
  severity: 'error' | 'warning' | 'info';
  message: string;
  resource?: string;
}

export interface Renderer {
  /**
   * Check if this renderer applies to the project
   */
  detect(projectPath: string): Promise<boolean>;

  /**
   * Get target paths for this agent
   */
  getTargetPaths(projectPath: string): Promise<Record<string, string>>;

  /**
   * Render a resource to agent-specific format
   */
  render(resource: ResourceManifest, target: RenderTarget): Promise<RenderedOutput>;

  /**
   * Validate rendered output against target
   */
  validate(output: RenderedOutput, target: RenderTarget): Promise<Diagnostic[]>;
}
```

**Renderer implementations:**

```
packages/core/src/renderers/
├── index.ts
├── claude-renderer.ts      # .claude/ format
├── cursor-renderer.ts      # .cursor/rules/ format
└── codex-renderer.ts       # .codex/ format
```

#### D3: Resource Registry

**Updated:** `packages/core/src/agent-registry.ts` → `packages/core/src/resource-registry.ts`

```typescript
/**
 * Central registry for canonical resources
 */

import type { ResourceManifest, ResourceType } from './resource.js';
import type { Renderer, RenderTarget } from './renderers/index.js';

export class ResourceRegistry {
  private resources: Map<string, ResourceManifest> = new Map();
  private renderers: Renderer[] = [];

  /**
   * Add a resource to the registry
   */
  async add(resource: ResourceManifest): Promise<void> {
    this.resources.set(resource.id, resource);
    await this.persistRegistry();
  }

  /**
   * List resources by type
   */
  list(filter?: { type?: ResourceType; tags?: string[] }): ResourceManifest[] {
    let result = Array.from(this.resources.values());

    if (filter?.type) {
      result = result.filter(r => r.type === filter.type);
    }

    if (filter?.tags) {
      result = result.filter(r =>
        filter.tags!.some(tag => r.metadata.tags?.includes(tag))
      );
    }

    return result;
  }

  /**
   * Sync resources to agent directories
   */
  async sync(target: RenderTarget, options?: { type?: ResourceType }): Promise<void> {
    const resources = this.list(options);
    const renderer = await this.selectRenderer(target);

    for (const resource of resources) {
      const output = await renderer.render(resource, target);
      await this.writeFiles(output.files, target.projectPath);

      // Log diagnostics
      for (const diag of output.diagnostics) {
        console.warn(`[${diag.severity}] ${diag.message}`);
      }
    }
  }

  /**
   * Register a renderer
   */
  registerRenderer(renderer: Renderer): void {
    this.renderers.push(renderer);
  }

  private async selectRenderer(target: RenderTarget): Promise<Renderer> {
    const renderer = this.renderers.find(r => r.detect(target.projectPath));
    if (!renderer) {
      throw new Error(`No renderer found for agent: ${target.agent}`);
    }
    return renderer;
  }

  private async writeFiles(files: RenderedFile[], basePath: string): Promise<void> {
    // Implementation
  }

  private async persistRegistry(): Promise<void> {
    // Save to ~/.agentkit/registry.json or project .agentkit/registry.json
  }
}
```

**Success Criteria:**
- ✅ ResourceManifest schema defined
- ✅ Renderer interface implemented
- ✅ ResourceRegistry can add/list/sync
- ✅ At least one renderer (Claude) implemented

---

### Phase E: MCP Server Implementation

**Goal:** Ship `agentkit mcp serve` for runtime discovery.

**New file:** `packages/mcp-server/package.json`

```json
{
  "name": "@agentkit/mcp-server",
  "version": "0.2.0",
  "description": "MCP server for AgentKit resource discovery",
  "main": "./dist/index.js",
  "bin": {
    "agentkit-mcp": "./dist/server.js"
  },
  "dependencies": {
    "@agentkit/core": "workspace:*",
    "@modelcontextprotocol/sdk": "^0.5.0"
  }
}
```

**New file:** `packages/mcp-server/src/server.ts`

```typescript
#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ResourceRegistry } from '@agentkit/core';

const registry = new ResourceRegistry();

const server = new Server(
  {
    name: 'agentkit',
    version: '0.2.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Tool: search_resources
server.setRequestHandler('tools/call', async (request) => {
  if (request.params.name === 'search_resources') {
    const { query, type, tags } = request.params.arguments as {
      query?: string;
      type?: string;
      tags?: string[];
    };

    const resources = registry.list({ type: type as any, tags });

    const filtered = query
      ? resources.filter(r =>
          r.name.toLowerCase().includes(query.toLowerCase()) ||
          r.description.toLowerCase().includes(query.toLowerCase())
        )
      : resources;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(filtered, null, 2),
        },
      ],
    };
  }

  throw new Error(`Unknown tool: ${request.params.name}`);
});

// Resource: agentkit://trending
server.setRequestHandler('resources/read', async (request) => {
  const uri = request.params.uri;

  if (uri === 'agentkit://trending') {
    // Return trending resources (mock for now)
    const trending = registry.list().slice(0, 10);
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(trending, null, 2),
        },
      ],
    };
  }

  throw new Error(`Unknown resource: ${uri}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
```

**CLI integration:**

`packages/cli/src/commands/mcp.ts`

```typescript
import { Command } from 'commander';
import { spawn } from 'child_process';

export function createMcpCommand(): Command {
  const mcp = new Command('mcp');
  mcp.description('MCP server commands');

  mcp
    .command('serve')
    .description('Start AgentKit MCP server')
    .action(async () => {
      console.log('Starting AgentKit MCP server...');
      const server = spawn('agentkit-mcp', [], {
        stdio: 'inherit',
      });

      server.on('exit', (code) => {
        process.exit(code ?? 0);
      });
    });

  return mcp;
}
```

**Success Criteria:**
- ✅ `agentkit mcp serve` starts MCP server
- ✅ `search_resources` tool works
- ✅ `agentkit://trending` resource accessible

---

### Phase F: Primer Generator

**Goal:** Auto-generate project instructions (like CLAUDE.md).

**New file:** `packages/cli/src/commands/primer.ts`

```typescript
import { Command } from 'commander';
import fs from 'fs/promises';
import path from 'path';
import { detectProjectStack } from '../utils/project-detector.js';
import { generatePrimer } from '../utils/primer-generator.js';

export function createPrimerCommand(): Command {
  const primer = new Command('primer');
  primer.description('Generate agent project instructions');

  primer
    .command('generate')
    .description('Generate primer for detected agents')
    .option('--agent <agent>', 'Target agent (claude, cursor, codex)')
    .action(async (options) => {
      const cwd = process.cwd();
      const stack = await detectProjectStack(cwd);

      console.log(`Detected stack: ${stack.languages.join(', ')}`);
      console.log(`Frameworks: ${stack.frameworks.join(', ')}`);

      const primerContent = generatePrimer(stack);

      // Write to agent directories
      const agents = options.agent ? [options.agent] : ['claude', 'cursor', 'codex'];

      for (const agent of agents) {
        const targetPath = getAgentPrimerPath(agent, cwd);
        await fs.mkdir(path.dirname(targetPath), { recursive: true });
        await fs.writeFile(targetPath, primerContent);
        console.log(`✓ Generated primer: ${targetPath}`);
      }
    });

  return primer;
}

function getAgentPrimerPath(agent: string, projectPath: string): string {
  switch (agent) {
    case 'claude':
      return path.join(projectPath, '.claude', 'CLAUDE.md');
    case 'cursor':
      return path.join(projectPath, '.cursor', 'rules', 'project.mdc');
    case 'codex':
      return path.join(projectPath, '.codex', 'instructions.md');
    default:
      throw new Error(`Unknown agent: ${agent}`);
  }
}
```

**Success Criteria:**
- ✅ `agentkit primer generate` detects project stack
- ✅ Generates appropriate CLAUDE.md / .cursor/rules / .codex files
- ✅ Content includes detected languages, frameworks, tooling

---

## Migration Execution Strategy

### Recommended Order

1. **Week 1: Phase A (Documentation)**
   - Low risk, high visibility
   - Establishes brand direction
   - No code changes

2. **Week 2: Phase B (Package Migration)**
   - Update all package.json files
   - Update all import paths
   - Create compatibility wrapper
   - **Release:** v0.2.0-alpha.1

3. **Week 3: Phase C (CLI Restructure)**
   - Implement unified commands
   - Add legacy command wrappers
   - **Release:** v0.2.0-alpha.2

4. **Week 4: Phase D (Core Refactor)**
   - Implement ResourceManifest schema
   - Create renderer abstraction
   - Implement Claude renderer
   - **Release:** v0.2.0-beta.1

5. **Week 5: Phase E + F (MCP + Primer)**
   - Implement MCP server
   - Implement primer generator
   - **Release:** v0.2.0-beta.2

6. **Week 6: Testing & Stabilization**
   - E2E testing
   - Documentation finalization
   - Migration guide refinement
   - **Release:** v0.2.0 (stable)

### Backward Compatibility Guarantees

| Version | Guarantee |
|---------|-----------|
| v0.2.x  | `caf` command works with deprecation warning |
| v0.2.x  | `agentkit skills/rules/subagents` work with warnings |
| v0.2.x  | Old package names installable (deprecated) |
| v0.3.0  | Remove `caf` binary; keep command aliases |
| v1.0.0  | Only `agentkit` unified commands supported |

### Rollback Plan

If critical issues arise:
1. Old packages (`@coding-agent-fabric/*`) remain on npm
2. Users can pin to `v0.1.x`
3. Git branch `legacy/coding-agent-fabric` frozen at v0.1.3

---

## Success Metrics

### Phase A
- [ ] All docs reference AgentKit
- [ ] Migration guide published

### Phase B
- [ ] 8 packages published to `@agentkit/*`
- [ ] `caf` wrapper functional
- [ ] All imports updated
- [ ] CI passes

### Phase C
- [ ] `agentkit add/list/remove` implemented
- [ ] Legacy commands functional with warnings
- [ ] 100% command compatibility

### Phase D
- [ ] ResourceManifest schema documented
- [ ] 3 renderers implemented (Claude, Cursor, Codex)
- [ ] `agentkit sync` works end-to-end

### Phase E
- [ ] MCP server starts successfully
- [ ] `search_resources` tool functional
- [ ] Integration test with Claude Code

### Phase F
- [ ] Primer generator detects 5+ common stacks
- [ ] Generates valid CLAUDE.md

---

## File Rename Map (Reference)

### Package Names

| Old | New |
|-----|-----|
| `@coding-agent-fabric/cli` | `@agentkit/cli` |
| `@coding-agent-fabric/core` | `@agentkit/core` |
| `@coding-agent-fabric/common` | `@agentkit/common` |
| `@coding-agent-fabric/plugin-api` | `@agentkit/plugin-api` |
| `@coding-agent-fabric/plugin-claude-code-hooks` | `@agentkit/plugin-claude-hooks` |
| `@coding-agent-fabric/plugin-cursor-hooks` | `@agentkit/plugin-cursor-hooks` |
| `@coding-agent-fabric/plugin-mcp` | `@agentkit/plugin-mcp` |

### Binary Names

| Old | New | Status |
|-----|-----|--------|
| `caf` | `agentkit` | Primary (v0.2+) |
| `coding-agent-fabric` | `ak` | Alias |
| `caf` | `caf` | Deprecated wrapper (v0.2-v0.3) |

### Directory Structure

| Old | New | Notes |
|-----|-----|-------|
| `packages/core/src/agent-registry.ts` | `packages/core/src/resource-registry.ts` | Renamed class |
| `packages/core/src/skills-handler.ts` | `packages/core/src/handlers/skill-handler.ts` | Restructured |
| `packages/core/src/rules-handler.ts` | `packages/core/src/handlers/rule-handler.ts` | Restructured |
| `packages/core/src/subagents-handler.ts` | `packages/core/src/handlers/subagent-handler.ts` | Restructured |
| N/A | `packages/core/src/resource.ts` | New |
| N/A | `packages/core/src/renderers/` | New |
| N/A | `packages/mcp-server/` | New |

---

## Next Actions

### Immediate (This Week)
1. ✅ Review and approve this migration plan
2. Create feature branch: `feat/agentkit-rebrand`
3. Execute Phase A (documentation updates)
4. Create `docs/migration-from-caf.md`

### Short-term (Next 2 Weeks)
1. Execute Phase B (package migration)
2. Set up dual publishing workflow
3. Update CI/CD for new package names
4. Release v0.2.0-alpha.1

### Medium-term (Next 4 Weeks)
1. Execute Phases C, D, E, F
2. Comprehensive testing
3. Release v0.2.0 stable
4. Deprecation notices for old packages

---

## Questions & Decisions

### Open Questions
1. **NPM Scope Availability:** Is `@agentkit` available on npm?
   - If not, alternatives: `@agent-kit`, `@agentkit-io`, `@theagentkit`
2. **Monorepo Strategy:** Keep single repo or split into multiple?
   - Recommendation: Keep monorepo for now
3. **License:** Keep MIT or switch to Apache-2.0 for all packages?
   - Current: Root is Apache-2.0, packages are MIT (inconsistent)
   - Recommendation: Standardize on Apache-2.0

### Decisions Made
- ✅ Primary command: `agentkit` (short alias: `ak`)
- ✅ Keep plugin architecture as first-class
- ✅ MCP-first for runtime discovery (REST optional later)
- ✅ Phased rollout with alpha/beta releases

---

## Appendix: Command Compatibility Matrix

| Old Command | New Command | v0.2 Support | v0.3 Support | v1.0 Support |
|-------------|-------------|--------------|--------------|--------------|
| `caf skills add` | `agentkit add --type skill` | ✅ (warn) | ✅ (warn) | ❌ |
| `caf skills list` | `agentkit list --type skill` | ✅ (warn) | ✅ (warn) | ❌ |
| `caf rules add` | `agentkit add --type rule` | ✅ (warn) | ✅ (warn) | ❌ |
| `caf subagents add` | `agentkit add --type subagent` | ✅ (warn) | ✅ (warn) | ❌ |
| `caf plugin add` | `agentkit plugin add` | ✅ (no warn) | ✅ | ✅ |
| `caf doctor` | `agentkit doctor` | ✅ (no warn) | ✅ | ✅ |
| `caf update` | `agentkit update` | ✅ (no warn) | ✅ | ✅ |
| N/A | `agentkit init` | ✅ (new) | ✅ | ✅ |
| N/A | `agentkit sync` | ✅ (new) | ✅ | ✅ |
| N/A | `agentkit mcp serve` | ✅ (new) | ✅ | ✅ |
| N/A | `agentkit primer` | ✅ (new) | ✅ | ✅ |

---

**Document Version:** 1.0
**Last Updated:** 2026-02-07
**Author:** AgentKit Migration Team
**Status:** Ready for Review
