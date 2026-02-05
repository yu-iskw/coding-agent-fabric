---
name: sync-readme
description: Synchronize technical sections in README.md and CONTRIBUTING.md with the actual project state.
version: 1.0.0
---

# sync-readme

Use this skill to keep the technical documentation (README.md and CONTRIBUTING.md) up-to-date with the codebase.

## When to Use

- After adding or renaming packages in the monorepo.
- After adding or modifying root scripts in `package.json`.
- After adding or changing CLI commands or subcommands.
- After significant architectural changes or package relationship updates.

## Workflow

1.  **Analyze Project State**:
    Directly observe the project to gather the necessary information:
    - **Layout**: List directories in `packages/` and `packages/plugins/` to see the monorepo structure.
    - **Scripts**: Read the root `package.json` to see available scripts.
    - **Commands**: Read CLI command definitions in `packages/cli/src/commands/` to identify commands and subcommands.

2.  **Locate Sync Markers**:
    Find the following markers in the documentation files:
    - `<!-- SYNC:LAYOUT -->` ... `<!-- /SYNC:LAYOUT -->`
    - `<!-- SYNC:SCRIPTS -->` ... `<!-- /SYNC:SCRIPTS -->`
    - `<!-- SYNC:COMMANDS -->` ... `<!-- /SYNC:COMMANDS -->`
    - `<!-- SYNC:ARCHITECTURE -->` ... `<!-- /SYNC:ARCHITECTURE -->`

3.  **Update Content**:
    Update the content between the markers based on your observations:
    - **Layout** -> `SYNC:LAYOUT` (usually in `CONTRIBUTING.md`): List packages and their descriptions from their respective `package.json` files.
    - **Scripts** -> `SYNC:SCRIPTS` (usually in `CONTRIBUTING.md`): Format scripts from the root `package.json` as a bulleted list.
    - **Commands** -> `SYNC:COMMANDS` (usually in `README.md`): Format CLI commands as markdown headings with bash examples.
    - **Architecture** -> `SYNC:ARCHITECTURE` (usually in `CONTRIBUTING.md`): Review and update the Mermaid diagram if package relationships or key components have changed.

4.  **Preserve Formatting**:
    Ensure that you keep the markers themselves and only update the content between them. Use appropriate markdown blocks (code blocks, lists) that match the existing documentation style.

## References

- See [references/mapping.md](references/mapping.md) for detailed mapping between metadata and doc sections.
