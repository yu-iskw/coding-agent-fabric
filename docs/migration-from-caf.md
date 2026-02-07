# Migration Guide: coding-agent-fabric → AgentKit

This guide helps you migrate from `coding-agent-fabric` (v0.1.x) to **AgentKit** (v0.2+).

## TL;DR

```bash
# Uninstall old package
npm uninstall -g @coding-agent-fabric/cli

# Install new package
npm install -g @agentkit/cli

# Use new command
agentkit doctor  # instead of: caf doctor
```

## What Changed?

### Product Name
- **Old**: coding-agent-fabric
- **New**: AgentKit

### NPM Packages
All packages have been renamed from `@coding-agent-fabric/*` to `@agentkit/*`:

| Old Package | New Package | Status |
|-------------|-------------|--------|
| `@coding-agent-fabric/cli` | `@agentkit/cli` | ✅ Published |
| `@coding-agent-fabric/core` | `@agentkit/core` | ✅ Published |
| `@coding-agent-fabric/common` | `@agentkit/common` | ✅ Published |
| `@coding-agent-fabric/plugin-api` | `@agentkit/plugin-api` | ✅ Published |
| `@coding-agent-fabric/plugin-claude-code-hooks` | `@agentkit/plugin-claude-hooks` | ✅ Published |
| `@coding-agent-fabric/plugin-cursor-hooks` | `@agentkit/plugin-cursor-hooks` | ✅ Published |
| `@coding-agent-fabric/plugin-mcp` | `@agentkit/plugin-mcp` | ✅ Published |

### CLI Commands

#### Primary Command Name

**Old**: `caf` (or `coding-agent-fabric`)
**New**: `agentkit` (or `ak` as short alias)

The `caf` command continues to work in v0.2.x with a deprecation warning:

```bash
$ caf doctor
⚠️  The `caf` command is deprecated. Please use `agentkit` instead.
   Migration guide: https://github.com/yu-iskw/agentkit#migration
```

#### Unified Command Structure (New in v0.2)

AgentKit v0.2 introduces unified resource management commands:

**Before (v0.1.x - Legacy):**
```bash
caf skills add owner/repo
caf skills list
caf skills remove skill-name
caf skills update

caf rules add owner/repo
caf rules list
caf rules remove rule-name

caf subagents add owner/repo
caf subagents list
caf subagents remove subagent-name
```

**After (v0.2.x - Modern):**
```bash
agentkit add owner/repo --type skill
agentkit list --type skill
agentkit remove skill-name
agentkit update

agentkit add owner/repo --type rule
agentkit list --type rule
agentkit remove rule-name

agentkit add owner/repo --type subagent
agentkit list --type subagent
agentkit remove subagent-name
```

**Backward Compatibility:** Legacy commands still work in v0.2.x:

```bash
agentkit skills add owner/repo  # Works but prints deprecation warning
agentkit rules add owner/repo   # Works but prints deprecation warning
```

#### New Commands

v0.2 introduces several new commands:

```bash
agentkit init          # Auto-detect agents and scaffold directories
agentkit sync          # Sync resources to agent directories
agentkit mcp serve     # Start MCP discovery server
agentkit primer        # Generate project instructions
```

### Command Compatibility Matrix

| Old Command | New Command | v0.2 Support | v0.3 Support | v1.0 Support |
|-------------|-------------|--------------|--------------|--------------|
| `caf skills add` | `agentkit add --type skill` | ✅ Both work | ✅ Warn | ❌ Removed |
| `caf skills list` | `agentkit list --type skill` | ✅ Both work | ✅ Warn | ❌ Removed |
| `caf rules add` | `agentkit add --type rule` | ✅ Both work | ✅ Warn | ❌ Removed |
| `caf subagents add` | `agentkit add --type subagent` | ✅ Both work | ✅ Warn | ❌ Removed |
| `caf plugin add` | `agentkit plugin add` | ✅ Both work | ✅ No warn | ✅ Same |
| `caf doctor` | `agentkit doctor` | ✅ Both work | ✅ No warn | ✅ Same |
| `caf update` | `agentkit update` | ✅ Both work | ✅ No warn | ✅ Same |

## Migration Steps

### For End Users

#### 1. Install AgentKit

```bash
# Global installation (recommended)
npm install -g @agentkit/cli

# Or use npx (no installation)
npx @agentkit/cli doctor
```

#### 2. Verify Installation

```bash
agentkit --version
# Should show: 0.2.0 or higher

agentkit doctor
# Check that your agents are detected
```

#### 3. (Optional) Uninstall Old Package

```bash
npm uninstall -g @coding-agent-fabric/cli
```

#### 4. Update Shell Aliases (if any)

If you have shell aliases using `caf`, update them:

```bash
# Old .bashrc/.zshrc
alias cf="caf"

# New .bashrc/.zshrc
alias ak="agentkit"
```

#### 5. Update Scripts

If you have scripts or CI/CD pipelines using `caf`, update them:

```bash
# Old package.json script
{
  "scripts": {
    "sync-agents": "caf skills update"
  }
}

# New package.json script
{
  "scripts": {
    "sync-agents": "agentkit update"
  }
}
```

### For Plugin Developers

If you've built plugins for coding-agent-fabric, update your dependencies:

#### 1. Update package.json

```json
{
  "name": "my-custom-plugin",
  "dependencies": {
    "@agentkit/plugin-api": "^0.2.0",
    "@agentkit/common": "^0.2.0"
  }
}
```

#### 2. Update Imports

```typescript
// Old
import { PluginManifest } from '@coding-agent-fabric/plugin-api';
import { AgentType } from '@coding-agent-fabric/common';

// New
import { PluginManifest } from '@agentkit/plugin-api';
import { AgentType } from '@agentkit/common';
```

#### 3. Update plugin.json

```json
{
  "id": "my-plugin",
  "name": "My Custom Plugin",
  "version": "1.0.0",
  "agentkit": "^0.2.0",
  "main": "./dist/index.js"
}
```

### For Monorepo/Team Setups

If you're using coding-agent-fabric in a team or monorepo:

#### 1. Update package.json Dependencies

```json
{
  "devDependencies": {
    "@agentkit/cli": "^0.2.0"
  }
}
```

#### 2. Update CI/CD Scripts

```yaml
# Old .github/workflows/ci.yml
- name: Sync agent resources
  run: npx @coding-agent-fabric/cli update

# New .github/workflows/ci.yml
- name: Sync agent resources
  run: npx @agentkit/cli sync
```

#### 3. Update Documentation

Update any internal documentation referencing `coding-agent-fabric`:
- README files
- Wiki pages
- Onboarding guides
- Scripts

## Breaking Changes

### v0.2.0

✅ **No breaking changes** - all v0.1.x commands continue to work with deprecation warnings.

### v0.3.0 (Planned)

⚠️ **Soft breaking changes**:
- `caf` binary removed (use `agentkit` instead)
- Legacy commands (`agentkit skills`, etc.) print warnings but still work

### v1.0.0 (Planned)

❌ **Hard breaking changes**:
- Legacy commands removed
- Only unified commands supported (`agentkit add/list/remove`)

## Rollback Plan

If you encounter issues with AgentKit v0.2+, you can rollback:

```bash
# Uninstall AgentKit
npm uninstall -g @agentkit/cli

# Reinstall old version
npm install -g @coding-agent-fabric/cli@0.1.3
```

The old packages will remain available on npm for the foreseeable future.

## Feature Comparison

| Feature | v0.1 (caf) | v0.2 (agentkit) |
|---------|------------|-----------------|
| Install skills/rules/subagents | ✅ | ✅ |
| Plugin system | ✅ | ✅ |
| Multi-agent support | ✅ | ✅ |
| Unified commands | ❌ | ✅ |
| MCP discovery server | ❌ | ✅ |
| Primer generator | ❌ | ✅ |
| Resource sync | ❌ | ✅ |
| Canonical resource model | ❌ | ✅ |
| Renderer abstraction | ❌ | ✅ |

## Frequently Asked Questions

### Q: Will `caf` stop working?

**A:** Not immediately. The `caf` command will:
- Work with deprecation warnings in v0.2.x
- Be removed in v0.3.0
- We recommend migrating to `agentkit` now to avoid disruption

### Q: Do I need to reinstall my skills/rules/subagents?

**A:** No. AgentKit v0.2 reads the same configuration directories (`.claude/`, `.cursor/`, `.codex/`) as v0.1.x. Your existing resources will continue to work.

### Q: Can I use both `caf` and `agentkit` simultaneously?

**A:** Yes, but not recommended. If both are installed:
- `caf` will be a wrapper that calls `agentkit` internally
- This can cause confusion - we recommend using only `agentkit`

### Q: What happens to the GitHub repository?

**A:** The repository has been renamed:
- **Old**: `https://github.com/owner/coding-agent-fabric`
- **New**: `https://github.com/yu-iskw/agentkit`

GitHub automatically redirects old URLs to the new location.

### Q: Why the rebrand?

**A:** AgentKit better communicates our product vision:
- Universal control plane for agent resources
- Portable skills across platforms
- Runtime discovery and dynamic tooling
- Stronger positioning inspired by SkillKit's approach

### Q: Will old packages be maintained?

**A:** The `@coding-agent-fabric/*` packages are deprecated but will:
- Remain on npm for backward compatibility
- Receive critical security fixes until v1.0
- Not receive new features

We strongly recommend migrating to `@agentkit/*`.

## Getting Help

If you encounter migration issues:

1. **Check the documentation**: [https://github.com/yu-iskw/agentkit](https://github.com/yu-iskw/agentkit)
2. **Search existing issues**: [https://github.com/yu-iskw/agentkit/issues](https://github.com/yu-iskw/agentkit/issues)
3. **File a new issue**: Include:
   - Your operating system
   - `agentkit --version` output
   - Steps to reproduce the problem
   - Error messages

## What's Next?

After migrating, explore new v0.2 features:

```bash
# Auto-detect agents in your project
agentkit init

# Generate project instructions
agentkit primer

# Start MCP discovery server
agentkit mcp serve

# Sync all resources
agentkit sync
```

Read the full [AgentKit documentation](https://github.com/yu-iskw/agentkit) to learn more.

---

**Last Updated:** 2026-02-07
**AgentKit Version:** 0.2.0
**Document Version:** 1.0
