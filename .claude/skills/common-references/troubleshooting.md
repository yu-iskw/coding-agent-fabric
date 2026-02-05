# Troubleshooting Knowledge Base

This document provides resolutions for common errors encountered during build, lint, and test cycles.

## TypeScript Errors

### TS2322: Type 'X' is not assignable to type 'Y'

- **Cause**: Variable or property assignment with incompatible types.
- **Fix**: Check interface/type definitions. If the change was deliberate, update the receiving type or cast if safe.

### TS2307: Cannot find module '...'

- **Cause**: Missing dependency or incorrect path mapping in `tsconfig.json`.
- **Fix**: Ensure the package is in `package.json`. If it's a workspace package, check if it's correctly linked in `pnpm-workspace.yaml`.

## pnpm & Dependencies

### Missing Dependencies in Node Modules

- **Cause**: Out-of-sync `pnpm-lock.yaml`.
- **Fix**: Run `pnpm install`. If persistence fails, try a "hard reset" using the `clean-project` skill.

### Peer Dependency Mismatch

- **Cause**: Multiple versions of a package required by different dependencies.
- **Fix**: Use `pnpm.peerDependencyRules` in root `package.json` to ignore or force versions if compatible.

## Trunk & Linting

### Trunk Timeout

- **Cause**: Large codebase or heavy linter (like `trivy`).
- **Fix**: Increase timeout in `.trunk/trunk.yaml` or run with `--all` only when necessary.

### Trunk Environment Errors

- **Cause**: Required runtime (Node.js version) mismatch.
- **Fix**: Ensure Node.js version matches `.node-version`. Run `trunk install` to refresh hermetic tools.

## Unit Tests (Vitest)

### Snapshots Failing

- **Cause**: UI change or data structure update.
- **Fix**: Review the diff. If intentional, run `pnpm test -- -u` to update snapshots.
