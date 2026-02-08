# AgentKit Canonical Schemas

This directory contains JSON Schema definitions for all AgentKit resource types. These schemas define the **canonical format** - the agent-agnostic representation that AgentKit uses internally before translating to agent-specific formats.

## Schema Files

| Schema                          | Description                                                    | Status |
| ------------------------------- | -------------------------------------------------------------- | ------ |
| `skill.schema.json`             | Reusable instruction modules (skills)                          | ✅ v1  |
| `subagent.schema.json`          | Specialized agent definitions                                  | ✅ v1  |
| `agent-profile.schema.json`     | Agent-specific configuration and translation rules             | ✅ v1  |
| `manifest.schema.json`          | Project manifest (`agentkit.yaml`)                             | ✅ v1  |
| `lockfile.schema.json`          | Resolved lockfile (`agentkit.lock`)                            | ✅ v1  |
| `rule.schema.json`              | Agent directives and constraints *(planned)*                   | 🔄 TBD |
| `workflow.schema.json`          | Multi-step orchestration *(planned)*                           | 🔄 TBD |
| `context-pack.schema.json`      | Project context bundles *(planned)*                            | 🔄 TBD |
| `mcp-server-config.schema.json` | MCP server configurations *(may merge into manifest)*          | 🔄 TBD |

## Design Principles

### 1. Canonical First

All resources are defined in a canonical, agent-agnostic format. Agent-specific artifacts are **derived** through translation, never hand-written.

**Example:** A skill written in canonical format:

```yaml
---
name: test-and-fix
version: 1.0.0
description: Run tests and fix failures
category: testing
supports:
  agents: [claude-code, cursor, gemini-cli]
---

# Test and Fix Skill

This skill runs your test suite and fixes failures automatically.

[Content here...]
```

**Translates to:**

- **Claude Code**: `.claude/skills/test-and-fix.md` (Markdown, YAML frontmatter)
- **Cursor**: `.cursor/rules/test-and-fix.mdc` (Markdown, JSON sidecar)
- **Gemini CLI**: `.codex/skills/test-and-fix.md` (Markdown, stripped frontmatter)

### 2. JSON Schema for Validation

All schemas use [JSON Schema Draft 2020-12](https://json-schema.org/draft/2020-12/schema) for:

- **Validation**: Ensure resources meet requirements
- **Autocomplete**: IDE support when editing resources
- **Documentation**: Self-documenting schema fields
- **Tooling**: Generate TypeScript types, validators, etc.

### 3. Extensibility

Schemas support `additionalProperties` or `metadata` fields for:

- Custom agent-specific features
- Experimental features
- Plugin extensions

### 4. Versioning

Each schema has a `version` field:

- **Breaking changes**: Major version bump (e.g., `1.0.0` → `2.0.0`)
- **New optional fields**: Minor version bump (e.g., `1.0.0` → `1.1.0`)
- **Fixes/clarifications**: Patch version bump (e.g., `1.0.0` → `1.0.1`)

AgentKit can support multiple schema versions simultaneously during transitions.

## Schema Structure

### Common Fields

All resource schemas share these fields:

```typescript
{
  "name": string,           // Unique identifier (kebab-case)
  "version": string,        // Semver version
  "description": string,    // Human-readable summary
  "tags": string[],         // Searchable keywords (optional)
  "author": {               // Author info (optional)
    "name": string,
    "email": string,
    "url": string
  },
  "license": string,        // SPDX identifier (optional)
  "provenance": {           // Source tracking (optional)
    "source": string,       // Origin (github:owner/repo, npm:package)
    "commit": string,       // Git commit SHA
    "integrity": string,    // Subresource Integrity hash
    "signature": string     // Digital signature
  },
  "metadata": object        // Custom metadata (optional)
}
```

### Quality Scores

Resources that support quality evaluation (skills, subagents) include:

```typescript
{
  "quality": {
    "structure": number,    // 0-5: Schema compliance, formatting
    "clarity": number,      // 0-5: Clear instructions, examples
    "specificity": number,  // 0-5: Concrete, actionable guidance
    "advanced": number      // 0-5: Error handling, complex workflows
  }
}
```

**Scoring:**

- **0-1**: Poor (incomplete, unclear, or broken)
- **2-3**: Adequate (functional but limited)
- **4-5**: Excellent (comprehensive, clear, robust)

### Dependencies

Resources can declare dependencies on other resources:

```typescript
{
  "dependencies": [
    {
      "type": "skill" | "rule" | "subagent" | "tool" | "mcp-server",
      "name": string,
      "version": string,    // Semver range (^1.0.0, >=2.0.0 <3.0.0)
      "optional": boolean   // Default: false
    }
  ]
}
```

## Usage

### TypeScript Type Generation

Generate TypeScript types from schemas:

```bash
# Using json-schema-to-typescript
npm install -g json-schema-to-typescript
json2ts -i skill.schema.json -o skill.types.ts
```

### Validation in Code

```typescript
import Ajv from 'ajv';
import skillSchema from './skill.schema.json';

const ajv = new Ajv();
const validate = ajv.compile(skillSchema);

const skill = {
  name: 'test-and-fix',
  version: '1.0.0',
  description: 'Run tests and fix failures',
  content: '# Test and Fix\n\n...',
};

if (validate(skill)) {
  console.log('Valid skill!');
} else {
  console.error('Validation errors:', validate.errors);
}
```

### IDE Integration

For VS Code, add to `.vscode/settings.json`:

```json
{
  "json.schemas": [
    {
      "fileMatch": ["**/skills/**/*.json"],
      "url": "./docs/schemas/skill.schema.json"
    },
    {
      "fileMatch": ["**/agentkit.yaml", "**/agentkit.yml"],
      "url": "./docs/schemas/manifest.schema.json"
    },
    {
      "fileMatch": ["**/agentkit.lock"],
      "url": "./docs/schemas/lockfile.schema.json"
    }
  ]
}
```

## Schema Evolution

### Adding New Fields

**Minor version bump** (backward compatible):

```diff
  {
    "properties": {
      "name": { "type": "string" },
      "version": { "type": "string" },
+     "homepage": { "type": "string", "format": "uri" }
    }
  }
```

### Breaking Changes

**Major version bump** (not backward compatible):

```diff
  {
    "properties": {
-     "tags": { "type": "string" },
+     "tags": { "type": "array", "items": { "type": "string" } }
    }
  }
```

### Deprecation Process

1. **Announce**: Add deprecation notice to schema description
2. **Warn**: Validators emit warnings for deprecated fields
3. **Remove**: After 2 major versions, remove deprecated fields

**Example:**

```json
{
  "oldField": {
    "type": "string",
    "deprecated": true,
    "description": "DEPRECATED: Use 'newField' instead. Will be removed in v3.0.0."
  },
  "newField": {
    "type": "string",
    "description": "Replaces 'oldField'"
  }
}
```

## Contributing

When adding or modifying schemas:

1. **Follow JSON Schema spec**: Use Draft 2020-12
2. **Add examples**: Include realistic `examples` in fields
3. **Document constraints**: Explain `pattern`, `minimum`, `maximum` choices
4. **Update this README**: Add new schemas to the table
5. **Update tests**: Add validation test cases
6. **Version correctly**: Follow semver for schema versions

## References

- [JSON Schema Official Site](https://json-schema.org/)
- [JSON Schema Validator (ajv)](https://ajv.js.org/)
- [Understanding JSON Schema](https://json-schema.org/understanding-json-schema/)
- [SkillKit Specification](https://github.com/Joshuafrankle/skillkit) (inspiration)

---

**Maintained by:** AgentKit Platform Team
**Last Updated:** 2026-02-07
