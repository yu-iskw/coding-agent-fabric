# AgentKit v1.0 Product Specification

**Version:** 1.0.0-draft
**Date:** 2026-02-07
**Status:** Draft
**Authors:** Platform Team

---

## Executive Summary

**AgentKit** is a universal runtime and packaging platform for coding-agent resources. It enables developers to write resource definitions (skills, rules, subagents, tools, etc.) once in a canonical format and deploy them across multiple coding agents (Claude Code, Cursor, Gemini CLI, GitHub Copilot, etc.) through automated translation and synchronization.

**Core Value Proposition:**

> "Write once. Deploy to every agent."

AgentKit provides:

1. **Canonical Resource Format**: Standard schemas for skills, rules, agents, tools, and contexts
2. **Translation Engine**: Automated conversion to agent-specific formats
3. **Runtime Discovery**: REST and MCP APIs for dynamic resource access
4. **Quality Assurance**: Built-in validation, testing, and scoring
5. **Team Collaboration**: Git-committable manifests for reproducible environments

---

## Product Principles

### 1. Canonical First

All resources are defined in a canonical, agent-agnostic format. Agent-specific artifacts are derived through pure translation functions.

**Rationale:** Single source of truth prevents drift and simplifies maintenance.

### 2. Deterministic Operations

Given the same inputs, AgentKit produces identical outputs. All installs are reproducible via lockfiles.

**Rationale:** Teams need consistent, predictable environments.

### 3. Separation of Concerns

- **Core engine**: Pure logic, no filesystem access
- **Adapters**: Handle agent-specific I/O
- **Plugins**: Optional extensions with sandboxed execution

**Rationale:** Testability, security, and extensibility.

### 4. Secure by Default

- Registry packages are signed and verified
- Plugins run in sandboxes with explicit permissions
- Provenance metadata tracks resource origins

**Rationale:** Developer tools are high-value targets; security is foundational.

### 5. Progressive Complexity

Beginners can install resources with 4 commands. Experts can automate, customize, and extend.

**Rationale:** Wide audience from solo devs to enterprise teams.

### 6. Agent Neutrality

AgentKit does not favor any specific coding agent. All agents are first-class citizens.

**Rationale:** Platform credibility and adoption.

---

## Resource Model

AgentKit manages **typed resources**. Each resource type has:

- **Canonical schema** (JSON Schema)
- **Lifecycle** (discover → parse → validate → translate → install → test)
- **Translation rules** (per agent)

### Core Resource Types

#### 1. Skill

**Purpose:** Reusable instruction modules that enhance agent capabilities.

**Canonical Format:** Markdown with YAML frontmatter (inspired by SkillKit's `SKILL.md`)

**Example:**

```markdown
---
name: test-and-fix
version: 1.0.0
description: Run tests and automatically fix failures
category: testing
tags: [testing, automation, quality]
supports:
  agents: [claude-code, cursor, gemini-cli]
  languages: [typescript, javascript, python]
quality:
  structure: 5
  clarity: 4
  specificity: 5
  advanced: 3
---

# Test and Fix Skill

This skill runs your project's test suite and attempts to fix failures automatically.

## Usage

Invoke with `/test-and-fix` or ask the agent to "run tests and fix any failures."

## Workflow

1. Detect test framework (Vitest, Jest, pytest, etc.)
2. Run tests
3. Parse failures
4. Analyze error messages
5. Suggest and apply fixes
6. Re-run tests to verify
7. Report results

## Examples

[Detailed examples here...]
```

**Fields:**

- `name` (required): Unique identifier
- `version` (required): Semver
- `description` (required): Short summary
- `category` (optional): Categorization (e.g., testing, debugging)
- `tags` (optional): Searchable keywords
- `supports` (optional): Constraints (agents, languages, frameworks)
- `quality` (optional): Self-reported quality scores
- `dependencies` (optional): Other resources required

#### 2. Rule

**Purpose:** Agent directives and constraints (e.g., code style, project conventions).

**Canonical Format:** Markdown or structured YAML

**Example:**

```yaml
---
name: typescript-conventions
version: 1.0.0
description: TypeScript code style and conventions
applies_to:
  globs: ["**/*.ts", "**/*.tsx"]
  agents: [claude-code, cursor]
---

# TypeScript Conventions

- Use `interface` for object shapes, `type` for unions/intersections
- Prefer `const` over `let`
- Use functional programming patterns where appropriate
- File names: kebab-case (e.g., `user-service.ts`)
```

**Note:** Rules may be merged into Skills in the unified model (to be decided).

#### 3. Agent Profile

**Purpose:** Configuration for a specific coding agent.

**Canonical Format:** JSON

**Example:**

```json
{
  "name": "claude-code",
  "version": "1.0.0",
  "targetDirs": {
    "skills": ".claude/skills",
    "rules": ".claude/rules",
    "agents": ".claude/agents",
    "hooks": ".claude/hooks"
  },
  "translationRules": {
    "skills": "markdown",
    "rules": "markdown",
    "agents": "yaml"
  },
  "featureSupport": {
    "hooks": true,
    "mcp": true,
    "subagents": true
  }
}
```

#### 4. Subagent

**Purpose:** Specialized agent definitions for specific tasks.

**Canonical Format:** YAML or JSON

**Example:**

```yaml
name: code-reviewer
version: 1.0.0
description: Expert code reviewer for quality and security
model: claude-sonnet-4-5
prompt: |
  You are an expert code reviewer. Review code changes for:
  - Code quality and best practices
  - Security vulnerabilities
  - Performance issues
  - Test coverage
  Provide actionable, specific feedback.
tools:
  - Read
  - Grep
  - Glob
  - Bash
```

#### 5. MCP Server Config

**Purpose:** Configuration for Model Context Protocol servers.

**Canonical Format:** JSON

**Example:**

```json
{
  "name": "filesystem-mcp",
  "version": "1.0.0",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-filesystem", "/workspace"],
  "env": {
    "NODE_ENV": "production"
  }
}
```

#### 6. Workflow

**Purpose:** Multi-step orchestration of skills and subagents.

**Canonical Format:** YAML

**Example:**

```yaml
name: full-test-cycle
version: 1.0.0
description: Build, lint, test, and report
steps:
  - skill: build-and-fix
  - skill: lint-and-fix
  - skill: test-and-fix
  - subagent: code-reviewer
    input: "Review all changes"
on_failure: report
```

#### 7. Context Pack

**Purpose:** Project-level context (stack, conventions, policies).

**Canonical Format:** Markdown with metadata

**Example:**

```markdown
---
name: typescript-monorepo-context
version: 1.0.0
description: TypeScript monorepo with pnpm
stack: [typescript, node, pnpm, vitest]
---

# Project Context

This is a TypeScript monorepo using:

- pnpm for package management
- Vitest for testing
- Trunk for linting
- GitHub Actions for CI/CD

[More context...]
```

---

## Resource Lifecycle

AgentKit processes resources through a standardized lifecycle (inspired by SkillKit):

```
┌──────────┐
│ Discover │  Find resources in source (GitHub, local, registry)
└─────┬────┘
      │
      ▼
┌──────────┐
│ Evaluate │  Score quality (structure, clarity, specificity)
└─────┬────┘
      │
      ▼
┌──────────┐
│  Parse   │  Extract metadata and content
└─────┬────┘
      │
      ▼
┌──────────┐
│ Validate │  Check schema compliance, dependencies
└─────┬────┘
      │
      ▼
┌───────────┐
│ Translate │  Convert to agent-specific formats
└─────┬─────┘
      │
      ▼
┌──────────┐
│ Install  │  Write to target directories
└─────┬────┘
      │
      ▼
┌──────────┐
│   Test   │  Run resource tests (optional)
└──────────┘
```

Each stage is:

- **Idempotent**: Re-running produces the same result
- **Reversible**: Can be undone cleanly
- **Auditable**: Logged for compliance

---

## Translation Engine

The **Translation Engine** converts canonical resources to agent-specific formats.

### Translation Mapping Example

**Canonical Skill** → **Claude Code**

- Format: Markdown (unchanged)
- Target: `.claude/skills/{name}.md`
- Metadata: Strip frontmatter or embed as HTML comments (agent preference)

**Canonical Skill** → **Cursor**

- Format: Markdown with `.mdc` extension (Cursor-specific)
- Target: `.cursor/rules/{name}.mdc`
- Metadata: JSON sidecar file

**Canonical Subagent** → **Claude Code**

- Format: YAML
- Target: `.claude/agents/{name}.yaml`

**Canonical Subagent** → **Cursor**

- Format: JSON (Cursor doesn't support YAML subagents)
- Target: `.cursor/agents/{name}.json`
- Note: Add compatibility warning if feature unsupported

### Translation Rules

Translation rules are:

1. **Pure functions**: `translate(resource, targetAgent) → artifacts`
2. **Lossless when possible**: Preserve all canonical data
3. **Gracefully degrading**: Unsupported features → warnings, not errors
4. **Deterministic**: Same input = same output

---

## Quality Assurance

AgentKit evaluates resource quality using a **4-dimension scoring model** (inspired by SkillKit):

### Quality Dimensions

1. **Structure** (0-5)
   - Valid schema
   - Complete metadata
   - Proper formatting

2. **Clarity** (0-5)
   - Clear description
   - Understandable instructions
   - Good examples

3. **Specificity** (0-5)
   - Concrete, actionable guidance
   - Not overly generic
   - Edge cases covered

4. **Advanced** (0-5)
   - Error handling
   - Complex workflows
   - Advanced features

**Overall Score:** Weighted average (customizable)

**Default Weights:**

```json
{
  "structure": 0.3,
  "clarity": 0.3,
  "specificity": 0.3,
  "advanced": 0.1
}
```

### Validation

Resources must pass:

1. **Schema validation**: JSON Schema compliance
2. **Dependency check**: All dependencies available
3. **Compatibility check**: Supported by target agents
4. **Security scan**: No hardcoded secrets, unsafe commands

---

## Team Collaboration

AgentKit enables team synchronization via **manifests and lockfiles**.

### agentkit.yaml (Manifest)

User-defined desired state:

```yaml
version: 1
config:
  defaultScope: project
  preferredAgents: [claude-code, cursor]
  namingStrategy: smart-disambiguation

resources:
  - source: github:agentkit/skills-typescript
    type: skill
    include: [test-and-fix, build-and-fix]

  - source: local:./custom-skills
    type: skill

  - source: npm:@acme/coding-rules
    type: rule
```

### agentkit.lock (Lockfile)

Resolved, immutable state:

```yaml
version: 1
lastUpdated: "2026-02-07T10:00:00Z"
resources:
  test-and-fix:
    type: skill
    version: 1.2.3
    source: github:agentkit/skills-typescript
    sourceUrl: https://github.com/agentkit/skills-typescript
    installedAt: "2026-02-07T09:30:00Z"
    integrity: sha256-abc123...

  # ... more resources
```

### Workflow

```bash
# 1. Edit agentkit.yaml to add/remove resources
# 2. Sync to apply changes
agentkit sync

# 3. Lockfile is updated automatically
# 4. Commit both files to git
git add agentkit.yaml agentkit.lock
git commit -m "Add test-and-fix skill"
```

**Team Benefit:** New team members run `agentkit sync` and get identical setup.

---

## Runtime Discovery

AgentKit exposes resources via **REST API** and **MCP server** for dynamic access.

### REST API

**Endpoints:**

- `GET /resources` - Search resources
- `GET /resources/:id` - Get resource details
- `GET /categories` - List categories
- `GET /recommend` - Get recommendations based on project
- `GET /health` - Health check

**Example:**

```bash
# Start discovery server
agentkit serve --port 3737

# Search for testing skills
curl http://localhost:3737/resources?category=testing&q=test

# Get specific resource
curl http://localhost:3737/resources/test-and-fix
```

### MCP Server

**Tools:**

- `search_resources(query, category, tags)`
- `get_resource(name)`
- `list_categories()`
- `recommend_resources(project_info)`

**Resources:**

- `resource://{name}` - Access resource content

**Example:**

```bash
# Run MCP server
agentkit mcp

# Agents can now discover resources via MCP
```

---

## User Experience

### Personas

#### 1. Solo Developer (Sara)

**Goal:** Quickly enhance coding agent with useful skills

**Journey:**

1. Discovers AgentKit via blog post
2. Installs CLI: `npm install -g @agentkit/cli`
3. Initializes project: `agentkit init`
4. Adds testing skill: `agentkit add agentkit/skills-typescript`
5. Uses skill in Claude Code: `/test-and-fix`

**Success Metrics:**

- Time to first skill: < 5 minutes
- Understanding of core concept: Clear after README

#### 2. Team Lead (Tom)

**Goal:** Standardize agent behavior across 10-person team

**Journey:**

1. Sets up `agentkit.yaml` with required skills and rules
2. Commits to repo
3. Documents in README: "Run `agentkit sync` after clone"
4. Team members get consistent setup
5. Enforces quality via CI: `agentkit validate`

**Success Metrics:**

- Team setup time: < 2 minutes per person
- Configuration drift: Zero (enforced by lockfile)

#### 3. Tooling Engineer (Tina)

**Goal:** Embed resource discovery in custom agent runtime

**Journey:**

1. Adds `@agentkit/api` dependency
2. Starts discovery server in agent runtime
3. Implements dynamic skill loading
4. Exposes to users via UI or commands

**Success Metrics:**

- API integration time: < 1 hour
- Discovery latency: < 100ms per query

### Command Taxonomy

**Core Commands** (beginners):

- `agentkit init` - Initialize project
- `agentkit add <source>` - Add resource
- `agentkit sync` - Apply manifest
- `agentkit search <query>` - Find resources

**Management Commands:**

- `agentkit list` - Show installed resources
- `agentkit remove <name>` - Remove resource
- `agentkit update [name]` - Update resources
- `agentkit validate` - Check quality

**Advanced Commands:**

- `agentkit serve` - Start REST API
- `agentkit mcp` - Start MCP server
- `agentkit translate <file> --to <agent>` - Manual translation
- `agentkit test <name>` - Run resource tests

**System Commands:**

- `agentkit doctor` - Health check
- `agentkit plugin <subcommand>` - Manage plugins

**Backward Compatibility:**

- `caf` → `agentkit` (with deprecation warning in v1.x)

---

## Platform Architecture

### Package Structure

```
@agentkit/core              - Canonical models, parser, validator, translator, quality scorer
@agentkit/cli               - CLI and TUI
@agentkit/common            - Shared types and utilities
@agentkit/api               - REST discovery server
@agentkit/mcp               - MCP discovery server
@agentkit/registry          - Registry client and indexer
@agentkit/plugin-api        - Plugin development API
@agentkit/plugin-runtime    - Plugin sandbox and executor
@agentkit/adapters          - Agent-specific adapters
```

### Data Flow

```
┌─────────────┐
│   Sources   │  GitHub, local, npm, registry
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ @agentkit/  │  Parse, validate, score
│    core     │
└──────┬──────┘
       │
       ├────────────┬────────────┐
       ▼            ▼            ▼
   ┌────────┐  ┌────────┐  ┌────────┐
   │Adapter │  │Adapter │  │Adapter │
   │Claude  │  │Cursor  │  │Gemini  │
   └────────┘  └────────┘  └────────┘
       │            │            │
       ▼            ▼            ▼
   .claude/     .cursor/      .codex/
```

### Storage

**Local Store** (`~/.agentkit/`):

- Registry cache
- Downloaded resources
- Plugin binaries

**Project Store** (`.agentkit/`):

- `agentkit.yaml` - Manifest
- `agentkit.lock` - Lockfile
- `agentkit-audit.log` - Audit trail (optional)

---

## Non-Goals (v1.0)

To maintain focus, AgentKit v1.0 will **not** include:

1. **Mesh Networking**: Distributed execution across agents
2. **Visual Builder**: GUI for creating resources (CLI/text only)
3. **Agent Execution**: AgentKit manages resources, not agent runtime
4. **Cloud Sync**: No cloud storage (git is sufficient)
5. **Paid Marketplace**: Registry is open and free (v1)

These may be considered for future versions.

---

## Success Metrics

### Adoption Metrics

- **npm downloads**: 10K/month by month 6
- **GitHub stars**: 1K by month 6
- **Active projects**: 500 by month 12

### Quality Metrics

- **Resource quality**: Average score > 3.5/5
- **Translation accuracy**: > 95% lossless conversions
- **Test coverage**: > 80% for core packages

### User Satisfaction

- **Time to first resource**: < 5 minutes
- **Setup time (teams)**: < 2 minutes per person
- **Net Promoter Score**: > 40

---

## Open Questions

1. **Unify Skills and Rules?**
   - Current: Separate resource types
   - Proposed: Rules are a subset of Skills with specific semantics
   - **Decision needed by:** Phase 1 completion

2. **Adapter Package Split?**
   - Option A: Monolithic `@agentkit/adapters`
   - Option B: Per-agent packages (`@agentkit/adapter-claude-code`)
   - **Recommendation:** Start monolithic, split if needed

3. **Registry Architecture?**
   - Option A: Centralized (like npm)
   - Option B: Federated (multiple registries)
   - **Recommendation:** Centralized for v1, federated later

4. **Plugin Security Model?**
   - Option A: Sandboxed WebAssembly
   - Option B: Node.js worker threads with permissions
   - **Recommendation:** Worker threads (simpler), WASM later

---

## Roadmap

### v1.0 (Target: 8-12 weeks)

- ✅ Core engine (parser, validator, translator)
- ✅ CLI with core commands
- ✅ 3 adapters (Claude Code, Cursor, Gemini CLI)
- ✅ Manifest and lockfile system
- ✅ Quality scoring
- ✅ Basic registry spec

### v1.1 (Target: +4 weeks)

- REST API for discovery
- MCP server for discovery
- Plugin system v2 (sandboxed)

### v1.2 (Target: +4 weeks)

- TUI (interactive mode)
- Advanced translation rules
- Resource testing framework

### v2.0 (Target: +12 weeks)

- Hosted registry/marketplace
- Signed packages and provenance
- Advanced workflows
- GitHub Copilot, Amazon Q, Tabnine adapters

---

## Appendix A: Comparison with SkillKit

AgentKit draws inspiration from SkillKit but differs in scope:

| Feature                     | SkillKit                   | AgentKit                      |
| --------------------------- | -------------------------- | ----------------------------- |
| **Focus**                   | Skills only                | All resource types            |
| **Canonical Format**        | SKILL.md                   | Type-specific schemas         |
| **Translation**             | ✅ Yes                     | ✅ Yes                        |
| **Runtime Discovery**       | ✅ REST + MCP              | ✅ REST + MCP                 |
| **Quality Scoring**         | ✅ 4-dimension             | ✅ 4-dimension (same model)   |
| **Team Collaboration**      | ✅ .skills manifest        | ✅ agentkit.yaml + lock       |
| **Agent Support**           | Multiple                   | Multiple + extensible         |
| **Plugin System**           | ❌ No                      | ✅ Yes                        |
| **Lockfile**                | ❌ No                      | ✅ Yes (reproducibility)      |
| **Subagents**               | ❌ No                      | ✅ Yes                        |
| **MCP Server Config**       | ❌ No                      | ✅ Yes                        |

**Key Differentiator:** AgentKit is a **platform** for all agent resources, not just skills.

---

## Appendix B: Glossary

- **Canonical Format**: Agent-agnostic resource definition
- **Translation**: Converting canonical → agent-specific
- **Adapter**: Agent-specific I/O handler
- **Manifest**: User-defined desired state (`agentkit.yaml`)
- **Lockfile**: Resolved immutable state (`agentkit.lock`)
- **Quality Score**: 0-5 rating across 4 dimensions
- **Resource**: Any managed artifact (skill, rule, subagent, etc.)
- **Source**: Origin of resource (GitHub, npm, local, registry)

---

**Document Status:** 🟡 Draft (Ready for Review)
**Next Review:** Phase 1 Completion
**Approvers:** Platform Team Lead, Community Feedback
