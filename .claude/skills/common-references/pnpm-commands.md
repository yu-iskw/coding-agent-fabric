# pnpm Commands for Node.js

This reference provides the commands used for pnpm to ensure a consistent upgrade workflow.

## Common Commands

| Task        | Command        |
| :---------- | :------------- |
| **Audit**   | `pnpm audit`   |
| **Test**    | `pnpm test`    |
| **Install** | `pnpm install` |
| **Lint**    | `pnpm lint`    |
| **Build**   | `pnpm build`   |

## Upgrade Commands

### Targeted Upgrade (Specific Package)

- `pnpm update <package>`

### Full Upgrade (All Packages within Semver)

- `pnpm update`

### Full Upgrade (Latest Versions)

- `pnpm update --latest`

## Monorepo / Workspace Support

For pnpm (the primary manager for this template):

- **Targeted (Root)**: `pnpm update <package> -w`
- **Targeted (Package)**: `pnpm --filter <package-name> update <package>`
- **All (Recursive)**: `pnpm -r update`
- **Recursive Build**: `pnpm -r build`
