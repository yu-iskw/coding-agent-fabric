---
name: lint-and-fix
description: Run linters and fix violations, formatting errors, or style mismatches using Trunk. Use when code quality checks fail, before submitting PRs, or to repair "broken" linting states.
---

# Lint and Fix Loop: Trunk

## Purpose

An autonomous loop for the agent to identify, fix, and verify linting and formatting violations using [Trunk](https://trunk.io).

## Loop Logic

1. **Identify**: Run `pnpm lint` (which executes `trunk check -y`) to list current violations. For a comprehensive check across the entire project, use `pnpm lint:all`. You can also run `pnpm lint:eslint` for focused ESLint checks.
2. **Analyze**: Examine the output from Trunk or ESLint, focusing on the file path, line number, and error message. Refer to [../common-references/troubleshooting.md](../common-references/troubleshooting.md) for environment or runtime issues.
3. **Fix**:
   - For formatting issues, run `pnpm format` (which executes `trunk fmt`). To format all files in the project, use `pnpm format:all`.
   - For linting violations, apply the minimum necessary change to the source code to resolve the error. You can use `pnpm format:eslint` to automatically fix many ESLint violations.
   - For security-specific checks, you can run `pnpm run lint:security`.
4. **Verify**: Re-run `pnpm lint` (or `pnpm lint:all` or `pnpm lint:eslint` depending on what you used initially).
   - If passed: Move to the next issue or finish if all are resolved.
   - If failed: Analyze the new failure and repeat the loop.

## Termination Criteria

- No more errors reported by `pnpm lint`, `pnpm lint:all`, or `pnpm lint:eslint`.
- Reached max iteration limit (default: 5).

## Examples

### Scenario: Fixing a formatting violation

1. `pnpm lint` reports formatting issues in `src/index.ts`.
2. Agent runs `pnpm format`.
3. `pnpm lint` now passes.

### Scenario: Performing a full project cleanup

1. Agent runs `pnpm lint:all` to check every file.
2. Several formatting issues are found.
3. Agent runs `pnpm format:all` to fix them all at once.
4. `pnpm lint:all` now passes.

### Scenario: Fixing ESLint violations

1. `pnpm lint:eslint` reports several linting errors.
2. Agent runs `pnpm format:eslint`.
3. `pnpm lint:eslint` now passes or shows fewer errors that require manual fixing.

## Resources

- [Project Scripts](../../../package.json): Definitions for all lint and format scripts.
- [Trunk CLI Reference](../common-references/trunk-commands.md): Common commands for linting and formatting.
- [Trunk Documentation](https://docs.trunk.io/): Official documentation for the Trunk CLI.
