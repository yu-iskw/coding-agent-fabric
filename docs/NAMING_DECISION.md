# AgentKit Naming Decision Document

**Date:** 2026-02-07
**Status:** Proposed
**Decision Owner:** Platform Team

## Executive Summary

This document outlines the naming strategy for rebranding `coding-agent-fabric` to `AgentKit`, addressing ecosystem collision risks and establishing a clear package naming convention.

## Problem Statement

The product name "AgentKit" has existing usage in the ecosystem:

1. **Inngest's agent-kit**: [`inngest/agent-kit`](https://github.com/inngest/agent-kit) - A framework for building AI agents
2. **OpenAI Documentation**: References to "AgentKit" in various contexts
3. **npm namespace**: Multiple packages with "agentkit" in the name

Using "AgentKit" as-is creates:

- **Search ambiguity**: Hard to find our project on GitHub/npm
- **SEO conflicts**: Search results diluted
- **User confusion**: "Which AgentKit?"

## Proposed Solution

### 1. Product Name

**Product Name:** `AgentKit`

**Marketing Tagline:** "The universal runtime and packaging format for coding-agent resources"

**Differentiation Strategy:**

- Always use full context in documentation: "AgentKit (Coding Agent Resource Platform)"
- Clear positioning: "AgentKit is a packaging and runtime platform, not an agent framework"
- Distinct visual branding and logo

### 2. npm Scope

**Recommended Scope:** `@agentkit`

**Rationale:**

- Clean, memorable, and aligned with product name
- Available on npm (verified)
- Shorter than alternatives (`@agentkit-platform`, `@agent-kit-platform`)

**Package Naming Convention:**

```
@agentkit/core          - Core engine (parsers, validators, translators)
@agentkit/cli           - Command-line interface
@agentkit/common        - Shared types and utilities
@agentkit/api           - REST discovery server
@agentkit/mcp           - MCP server for runtime discovery
@agentkit/plugin-api    - Plugin development API
@agentkit/registry      - Registry client and indexer
@agentkit/adapters      - Monolithic adapter package (or split by agent)
```

**Alternative considered:** `@agent-kit` (with hyphen)

- ❌ Less clean for import statements
- ❌ Slightly longer
- ✅ More distinct from `inngest/agent-kit`

**Decision:** Use `@agentkit` unless npm availability issues arise.

### 3. GitHub Repository

**Repository Name:** `agentkit/agentkit`

**Organization:** Create `agentkit` GitHub organization

**Rationale:**

- Clean namespace
- Room for future repositories (`agentkit/registry`, `agentkit/plugins`, etc.)
- Professional structure

**Migration Strategy:**

1. Create `agentkit` GitHub organization
2. Transfer repository from `yu-iskw/coding-agent-fabric` to `agentkit/agentkit`
3. Set up GitHub redirect from old URL
4. Update all documentation and links

### 4. Binary/CLI Command

**Primary Command:** `agentkit`

**Backward Compatibility:** Keep `caf` as alias for 1-2 major versions

**Installation:**

```bash
# New way
npm install -g @agentkit/cli

# CLI commands
agentkit init
agentkit add <source>
agentkit sync
agentkit search <query>
agentkit validate
```

**Deprecation Timeline:**

- **v1.0.0**: Introduce `agentkit` command, keep `caf` with deprecation warning
- **v2.0.0**: Remove `caf` alias, only `agentkit` supported

### 5. Domain Strategy

**Primary Domain:** `agentkit.dev` or `agentkit.sh`

**Purposes:**

- Documentation site
- Registry/marketplace (future)
- REST API endpoint (optional)

**Action Items:**

- [ ] Check domain availability
- [ ] Reserve domain before public announcement
- [ ] Set up docs site infrastructure

### 6. Collision Mitigation

To differentiate from other "AgentKit" projects:

**In Documentation:**

- Always include tagline: "AgentKit - The universal runtime for coding-agent resources"
- First paragraph of README clearly differentiates from agent frameworks
- "What AgentKit is NOT" section (not a framework, not Inngest's agent-kit)

**In SEO/Marketing:**

- Use keyword phrases: "coding agent packaging", "agent resource platform"
- GitHub topics: `coding-agents`, `agent-resources`, `skill-management`
- npm keywords: `coding-agents`, `ai-resources`, `agent-skills`

**In Community:**

- Clear positioning in announcements
- Direct comparison table if needed

## Migration Plan

### Phase 1: Preparation (Week 1)

- [ ] Reserve `@agentkit` npm scope
- [ ] Create `agentkit` GitHub organization
- [ ] Reserve `agentkit.dev` domain

### Phase 2: Repository Setup (Week 1-2)

- [ ] Transfer repository to `agentkit/agentkit`
- [ ] Update all package.json files with new scope
- [ ] Update all imports across codebase
- [ ] Update CI/CD configurations

### Phase 3: Documentation (Week 2)

- [ ] Update README.md with new branding
- [ ] Create "Migration Guide" for existing users
- [ ] Update all links and references
- [ ] Add "What is AgentKit?" section addressing confusion

### Phase 4: Publication (Week 3)

- [ ] Publish initial packages to `@agentkit` scope
- [ ] Deprecate `@coding-agent-fabric` packages with migration notice
- [ ] Announce rebrand with clear positioning

### Phase 5: Community Transition (Weeks 4-8)

- [ ] Monitor for confusion, update docs as needed
- [ ] Engage with users migrating from old packages
- [ ] Continue supporting `@coding-agent-fabric` for 6 months (security updates only)

## Package Compatibility Matrix

| Old Package                             | New Package                | Status                  |
| --------------------------------------- | -------------------------- | ----------------------- |
| `@coding-agent-fabric/core`             | `@agentkit/core`           | ✅ Direct replacement   |
| `@coding-agent-fabric/cli`              | `@agentkit/cli`            | ✅ Direct replacement   |
| `@coding-agent-fabric/common`           | `@agentkit/common`         | ✅ Direct replacement   |
| `@coding-agent-fabric/plugin-api`       | `@agentkit/plugin-api`     | ✅ Direct replacement   |
| `@coding-agent-fabric/plugin-mcp`       | `@agentkit/plugin-mcp`     | ⚠️ May merge into core |
| `@coding-agent-fabric/plugin-*-hooks`   | `@agentkit/adapters`       | 🔄 Architecture change  |

## npm Scope Reservation Checklist

- [ ] Create npm account for `agentkit` organization
- [ ] Request `@agentkit` scope from npm
- [ ] Add team members to organization
- [ ] Configure 2FA for all maintainers
- [ ] Set up automated publishing via CI/CD

## Communication Strategy

**Announcement Title:** "Introducing AgentKit: The Universal Runtime for Coding Agent Resources"

**Key Messages:**

1. "AgentKit is the evolution of coding-agent-fabric with a clearer mission"
2. "Write once, deploy to every coding agent"
3. "Not a framework - a packaging and runtime platform"

**Channels:**

- GitHub announcement
- npm package deprecation notice
- Reddit (r/programming, r/MachineLearning)
- Twitter/X
- Dev.to blog post

## Decision

**Approved Solution:**

- **Product Name:** AgentKit
- **npm Scope:** `@agentkit`
- **GitHub Org:** `agentkit`
- **Primary Command:** `agentkit` (keep `caf` temporarily)
- **Domain:** `agentkit.dev` (if available) or `agentkit.sh`

**Next Actions:**

1. Reserve npm scope and GitHub organization (Priority 1)
2. Create migration scripts for package renaming (Priority 1)
3. Update all package.json and imports (Priority 1)
4. Reserve domain (Priority 2)
5. Create migration guide for users (Priority 2)

## Open Questions

- [ ] Should we use `@agentkit/adapters` as a single package or split per agent?
  - **Recommendation:** Start with monolithic `@agentkit/adapters`, split later if needed
- [ ] Timeline for deprecating `@coding-agent-fabric` packages?
  - **Recommendation:** 6 months of security updates, then archive
- [ ] Support old `caf` command indefinitely or deprecate?
  - **Recommendation:** Deprecate in v2.0.0 (timeline: 6-12 months)

## Appendix: Competitor Analysis

| Project           | Scope/Name          | Purpose                    | Collision Risk |
| ----------------- | ------------------- | -------------------------- | -------------- |
| Inngest Agent Kit | `inngest/agent-kit` | Framework for building agents | Medium - different domain |
| AgentKit (OpenAI) | Documentation refs  | Various AI agent references | Low - no active package |
| Our AgentKit      | `@agentkit/core`    | Resource packaging platform | Mitigated by clear positioning |

---

**Document Status:** ✅ Proposed for Approval
**Last Updated:** 2026-02-07
**Reviewers:** Platform Team, Community
