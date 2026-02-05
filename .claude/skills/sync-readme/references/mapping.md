# Metadata Mapping

This document defines how to map project information to sections in the documentation.

| Category     | Marker Name         | File(s)           | Source                               | Expected Format                    |
| :----------- | :------------------ | :---------------- | :----------------------------------- | :--------------------------------- |
| Layout       | `SYNC:LAYOUT`       | `CONTRIBUTING.md` | `packages/`, `packages/plugins/`     | Code block (`text`)                |
| Scripts      | `SYNC:SCRIPTS`      | `CONTRIBUTING.md` | Root `package.json`                  | Bulleted list of bold script names |
| Commands     | `SYNC:COMMANDS`     | `README.md`       | `packages/cli/src/commands/*.ts`     | Markdown headings and code blocks  |
| Architecture | `SYNC:ARCHITECTURE` | `CONTRIBUTING.md` | Codebase structure and relationships | Mermaid diagram                    |

## Layout Format

The `layout` section should show the package structure.
Example:

```text
packages/
  cli            # Command-line interface for coding-agent-fabric
  ...
```

## Scripts Format

Format scripts as:

- **script-name**: `actual command`

## Commands Format

Format commands with headings and subcommands in bash blocks:

### command-name

Description

```bash
# sub-description
coding-agent-fabric command sub
```

## Architecture Format

The architecture section should use a Mermaid diagram to visualize the relationship between packages and key components. Maintain clear subgraphs for each package and use arrows to show dependency flow.
