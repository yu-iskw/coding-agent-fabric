# AgentKit Translation Model

**Version:** 1.0.0-draft
**Date:** 2026-02-07
**Status:** Draft

---

## Overview

The **Translation Engine** is AgentKit's core component that converts canonical resource definitions into agent-specific formats. This enables the "write once, deploy everywhere" philosophy.

**Key Principles:**

1. **Pure functions**: Translation is deterministic (same input → same output)
2. **Lossless when possible**: Preserve all canonical data
3. **Gracefully degrading**: Unsupported features → warnings, not errors
4. **Reversible**: Can reconstruct canonical from agent format (with metadata)

---

## Translation Pipeline

```
┌─────────────────┐
│  Canonical      │  Skill, Subagent, Rule, etc. (JSON/YAML with schema)
│  Resource       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Agent Profile  │  Load target agent's translation rules
│  Lookup         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Translation    │  Apply format conversions, path mappings
│  Rules          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Post-Process   │  Inject metadata, apply transformers
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Agent-Specific │  Files ready to write to agent directories
│  Artifacts      │
└─────────────────┘
```

---

## Translation Rules

Translation rules are defined in **Agent Profiles** and consist of:

### 1. Format Mappings

**Canonical → Target Format**

| Canonical Format        | Target Formats (examples)                     |
| ----------------------- | --------------------------------------------- |
| Markdown + YAML frontmatter | Markdown, Markdown (MDC), JSON sidecar, stripped |
| JSON                    | JSON, YAML, TOML                              |
| YAML                    | YAML, JSON                                    |

**Example: Skill Translation**

Canonical Skill (Markdown + YAML):

```yaml
---
name: test-and-fix
version: 1.0.0
description: Run tests and fix failures
category: testing
---

# Test and Fix Skill

[Content here...]
```

**Claude Code** (Markdown, keep frontmatter):

```markdown
---
name: test-and-fix
version: 1.0.0
description: Run tests and fix failures
category: testing
---

# Test and Fix Skill

[Content here...]
```

**Cursor** (Markdown MDC, JSON sidecar):

`.cursor/rules/test-and-fix.mdc`:

```markdown
# Test and Fix Skill

[Content here...]
```

`.cursor/rules/test-and-fix.meta.json`:

```json
{
  "name": "test-and-fix",
  "version": "1.0.0",
  "description": "Run tests and fix failures",
  "category": "testing"
}
```

**Gemini CLI** (Markdown, strip frontmatter):

```markdown
# Test and Fix Skill

[Content here...]
```

### 2. Path Mappings

**Resource Type → Target Directory**

Defined in Agent Profile:

```json
{
  "name": "claude-code",
  "targetDirs": {
    "skills": ".claude/skills",
    "rules": ".claude/rules",
    "agents": ".claude/agents",
    "hooks": ".claude/hooks",
    "mcp": ".claude/mcp.json"
  }
}
```

**Translation:**

- Canonical skill `test-and-fix` → `.claude/skills/test-and-fix.md`
- Canonical subagent `code-reviewer` → `.claude/agents/code-reviewer.yaml`

### 3. Frontmatter Handling

Different agents expect different frontmatter formats:

| Agent        | Frontmatter Strategy   | Example                                    |
| ------------ | ---------------------- | ------------------------------------------ |
| Claude Code  | YAML (keep)            | `---\nname: foo\n---`                      |
| Cursor       | JSON sidecar           | Separate `.meta.json` file                 |
| Gemini CLI   | Strip                  | Remove entirely                            |
| Windsurf     | HTML comment           | `<!-- {"name": "foo"} -->`                 |
| Aider        | YAML (keep)            | `---\nname: foo\n---`                      |

**Implementation:**

```typescript
function handleFrontmatter(
  content: string,
  metadata: object,
  strategy: 'yaml' | 'json-sidecar' | 'strip' | 'html-comment'
): { content: string; sidecar?: string } {
  switch (strategy) {
    case 'yaml':
      return { content: `---\n${yaml.dump(metadata)}---\n\n${content}` };
    case 'json-sidecar':
      return { content, sidecar: JSON.stringify(metadata, null, 2) };
    case 'strip':
      return { content };
    case 'html-comment':
      return { content: `<!-- ${JSON.stringify(metadata)} -->\n\n${content}` };
  }
}
```

### 4. File Extensions

Agent-specific file extensions:

| Resource   | Claude Code | Cursor  | Gemini CLI | Windsurf | Aider |
| ---------- | ----------- | ------- | ---------- | -------- | ----- |
| Skill      | `.md`       | `.mdc`  | `.md`      | `.md`    | `.md` |
| Rule       | `.md`       | `.mdc`  | `.md`      | `.md`    | `.md` |
| Subagent   | `.yaml`     | `.json` | `.yaml`    | `.yaml`  | N/A   |

---

## Agent Profiles

Agent Profiles define translation rules for each supported agent.

### Example: Claude Code Profile

```json
{
  "name": "claude-code",
  "version": "1.0.0",
  "displayName": "Claude Code",
  "targetDirs": {
    "skills": ".claude/skills",
    "rules": ".claude/rules",
    "agents": ".claude/agents",
    "hooks": ".claude/hooks",
    "mcp": ".claude/mcp.json"
  },
  "translationRules": {
    "skills": {
      "format": "markdown",
      "extension": ".md",
      "frontmatter": "yaml"
    },
    "rules": {
      "format": "markdown",
      "extension": ".md",
      "frontmatter": "yaml"
    },
    "agents": {
      "format": "yaml",
      "extension": ".yaml"
    }
  },
  "featureSupport": {
    "hooks": true,
    "mcp": true,
    "subagents": true,
    "workflows": true
  }
}
```

### Example: Cursor Profile

```json
{
  "name": "cursor",
  "version": "1.0.0",
  "displayName": "Cursor",
  "targetDirs": {
    "skills": ".cursor/fabric-skills",
    "rules": ".cursor/rules",
    "agents": ".cursor/agents",
    "hooks": ".cursor/hooks",
    "mcp": ".cursor/mcp.json"
  },
  "translationRules": {
    "skills": {
      "format": "markdown-mdc",
      "extension": ".mdc",
      "frontmatter": "json-sidecar"
    },
    "rules": {
      "format": "markdown-mdc",
      "extension": ".mdc",
      "frontmatter": "json-sidecar"
    },
    "agents": {
      "format": "json",
      "extension": ".json"
    }
  },
  "featureSupport": {
    "hooks": true,
    "mcp": true,
    "subagents": false,
    "workflows": false
  }
}
```

---

## Translation Examples

### Example 1: Skill Translation (Full)

**Canonical Skill:**

```yaml
---
name: debug-errors
version: 1.2.0
description: Analyze and fix runtime errors
category: debugging
tags: [debugging, errors, troubleshooting]
supports:
  agents: [claude-code, cursor, gemini-cli]
  languages: [typescript, javascript, python]
dependencies:
  - type: skill
    name: test-and-fix
    version: ^1.0.0
quality:
  structure: 5
  clarity: 4
  specificity: 4
  advanced: 3
---

# Debug Errors Skill

This skill helps you debug runtime errors by analyzing stack traces and suggesting fixes.

## Usage

When you encounter an error, invoke this skill with `/debug-errors` or ask the agent to analyze the error.

## Workflow

1. Parse error message and stack trace
2. Identify error type and location
3. Analyze surrounding code
4. Suggest potential fixes
5. Apply fix if user confirms
6. Re-run to verify

## Examples

[Detailed examples...]
```

**Translation to Claude Code:**

`.claude/skills/debug-errors.md`:

```markdown
---
name: debug-errors
version: 1.2.0
description: Analyze and fix runtime errors
category: debugging
tags:
  - debugging
  - errors
  - troubleshooting
supports:
  agents:
    - claude-code
    - cursor
    - gemini-cli
  languages:
    - typescript
    - javascript
    - python
dependencies:
  - type: skill
    name: test-and-fix
    version: ^1.0.0
quality:
  structure: 5
  clarity: 4
  specificity: 4
  advanced: 3
---

# Debug Errors Skill

This skill helps you debug runtime errors by analyzing stack traces and suggesting fixes.

[Same content...]
```

**Translation to Cursor:**

`.cursor/fabric-skills/debug-errors.mdc`:

```markdown
# Debug Errors Skill

This skill helps you debug runtime errors by analyzing stack traces and suggesting fixes.

[Same content...]
```

`.cursor/fabric-skills/debug-errors.meta.json`:

```json
{
  "name": "debug-errors",
  "version": "1.2.0",
  "description": "Analyze and fix runtime errors",
  "category": "debugging",
  "tags": ["debugging", "errors", "troubleshooting"],
  "supports": {
    "agents": ["claude-code", "cursor", "gemini-cli"],
    "languages": ["typescript", "javascript", "python"]
  },
  "dependencies": [
    {
      "type": "skill",
      "name": "test-and-fix",
      "version": "^1.0.0"
    }
  ],
  "quality": {
    "structure": 5,
    "clarity": 4,
    "specificity": 4,
    "advanced": 3
  }
}
```

**Translation to Gemini CLI (Codex):**

`.codex/skills/debug-errors.md`:

```markdown
# Debug Errors Skill

This skill helps you debug runtime errors by analyzing stack traces and suggesting fixes.

[Same content...]
```

*(Frontmatter stripped, metadata lost unless stored separately)*

---

### Example 2: Subagent Translation

**Canonical Subagent:**

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
maxTurns: 20
```

**Translation to Claude Code:**

`.claude/agents/code-reviewer.yaml`:

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
maxTurns: 20
```

**Translation to Cursor:**

`.cursor/agents/code-reviewer.json`:

```json
{
  "name": "code-reviewer",
  "version": "1.0.0",
  "description": "Expert code reviewer for quality and security",
  "model": "claude-sonnet-4-5",
  "prompt": "You are an expert code reviewer. Review code changes for:\n- Code quality and best practices\n- Security vulnerabilities\n- Performance issues\n- Test coverage\nProvide actionable, specific feedback.",
  "tools": ["Read", "Grep", "Glob", "Bash"],
  "maxTurns": 20
}
```

**Translation to Gemini CLI:**

⚠️ **Warning**: Gemini CLI does not support subagents. Resource skipped.

*(Alternative: Degrade to a "rule" or "skill" with instructions)*

---

## Feature Support Matrix

Not all agents support all features. The translation engine handles this gracefully:

| Feature        | Claude Code | Cursor | Gemini CLI | Windsurf | Aider |
| -------------- | ----------- | ------ | ---------- | -------- | ----- |
| Skills         | ✅          | ✅     | ✅         | ✅       | ✅    |
| Rules          | ✅          | ✅     | ✅         | ✅       | ✅    |
| Subagents      | ✅          | ✅     | ❌         | ✅       | ❌    |
| Hooks          | ✅          | ✅     | ❌         | ✅       | ❌    |
| MCP Servers    | ✅          | ✅     | ✅         | ✅       | ❌    |
| Workflows      | ✅          | ❌     | ❌         | ❌       | ❌    |

**Degradation Strategies:**

1. **Skip with warning**: If feature unsupported, emit warning and skip
2. **Downgrade**: Convert to simpler resource type (subagent → skill)
3. **Partial support**: Install what's possible, warn about limitations

---

## Implementation

### Core Translation Function

```typescript
interface TranslationContext {
  resource: CanonicalResource;
  targetAgent: AgentProfile;
  options?: TranslationOptions;
}

interface TranslationResult {
  files: Array<{
    path: string;
    content: string;
    mode?: number;
  }>;
  warnings: string[];
  errors: string[];
}

function translate(ctx: TranslationContext): TranslationResult {
  const { resource, targetAgent } = ctx;

  // 1. Check feature support
  if (!targetAgent.featureSupport[resource.type]) {
    return {
      files: [],
      warnings: [`${targetAgent.name} does not support ${resource.type}`],
      errors: [],
    };
  }

  // 2. Get translation rules
  const rules = targetAgent.translationRules[resource.type];

  // 3. Apply format conversion
  const { content, sidecar } = convertFormat(resource, rules);

  // 4. Generate file paths
  const targetDir = targetAgent.targetDirs[resource.type];
  const mainFile = {
    path: `${targetDir}/${resource.name}${rules.extension}`,
    content,
  };

  const files = [mainFile];
  if (sidecar) {
    files.push({
      path: `${targetDir}/${resource.name}.meta.json`,
      content: sidecar,
    });
  }

  return { files, warnings: [], errors: [] };
}
```

### Format Converters

```typescript
function convertMarkdownSkill(
  skill: SkillResource,
  rules: TranslationRules
): { content: string; sidecar?: string } {
  const { frontmatter, content } = skill;

  switch (rules.frontmatter) {
    case 'yaml':
      return {
        content: `---\n${yaml.dump(frontmatter)}---\n\n${content}`,
      };

    case 'json-sidecar':
      return {
        content,
        sidecar: JSON.stringify(frontmatter, null, 2),
      };

    case 'strip':
      return { content };

    case 'html-comment':
      return {
        content: `<!-- ${JSON.stringify(frontmatter)} -->\n\n${content}`,
      };

    default:
      throw new Error(`Unknown frontmatter strategy: ${rules.frontmatter}`);
  }
}
```

---

## Custom Transformers

For advanced use cases, agent profiles can specify **custom transformers**:

```json
{
  "translationRules": {
    "skills": {
      "format": "markdown",
      "extension": ".md",
      "frontmatter": "yaml",
      "transformer": "customSkillTransformer"
    }
  }
}
```

**Transformer Implementation:**

```typescript
// In plugin or extension
export function customSkillTransformer(
  skill: SkillResource,
  rules: TranslationRules
): TranslationResult {
  // Custom logic here
  return {
    files: [
      /* ... */
    ],
    warnings: [],
    errors: [],
  };
}

// Register transformer
AgentKit.registerTransformer('customSkillTransformer', customSkillTransformer);
```

---

## Reverse Translation (Import)

AgentKit can **import** existing agent resources into canonical format:

```bash
agentkit import .claude/skills/my-skill.md --type skill
```

**Process:**

1. Detect format (YAML frontmatter, JSON sidecar, etc.)
2. Parse metadata and content
3. Validate against canonical schema
4. Write to canonical resource store
5. Add to manifest

**Limitations:**

- May lose agent-specific metadata not in canonical schema
- Best-effort conversion (not guaranteed lossless)

---

## Testing Translation

AgentKit includes a test harness for translation rules:

```typescript
import { testTranslation } from '@agentkit/core/testing';

testTranslation({
  resource: mySkill,
  targetAgents: ['claude-code', 'cursor', 'gemini-cli'],
  assertions: {
    'claude-code': {
      fileCount: 1,
      hasYAMLFrontmatter: true,
    },
    cursor: {
      fileCount: 2, // .mdc + .meta.json
      hasSidecar: true,
    },
    'gemini-cli': {
      fileCount: 1,
      hasYAMLFrontmatter: false,
    },
  },
});
```

---

## Future Enhancements

- **Round-trip testing**: Canonical → Agent → Canonical (validate no data loss)
- **Diff preview**: Show changes before applying translation
- **Configurable transformers**: User-defined translation plugins
- **Format autodetection**: Automatically detect source format during import

---

## References

- [AgentKit Product Spec](./AGENTKIT_V1_PRODUCT_SPEC.md)
- [Canonical Schemas](./schemas/README.md)
- [Agent Profiles Directory](../packages/core/src/agent-profiles/)

---

**Status:** 🟡 Draft (Ready for Review)
**Maintained by:** AgentKit Platform Team
**Last Updated:** 2026-02-07
