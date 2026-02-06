---
name: bumpup-versions
description: Consistently bump and synchronize versions across all packages in the monorepo using pnpm. Use this to ensure the root and all workspace packages share the same version number.
---

# Bumpup Versions Skill

This skill provides a standardized workflow to synchronize and increment version numbers across the entire monorepo (root and all packages) using native `pnpm` commands.

## When to Use

- When preparing for a release that requires a unified version bump across all packages.
- When you notice version drift between the root `package.json` and workspace packages.
- When requested to "bump versions", "release a new version", or "sync package versions".

## Instructions

### 1. Determine Target Version

Identify if you are performing a semantic bump (`patch`, `minor`, `major`) or setting an explicit version (e.g., `1.0.0`).

### 2. Synchronize Workspace Packages

Run the version command recursively across all packages in the workspace using `pnpm -r exec`. The `--no-git-tag-version` flag prevents automatic git tagging and commits, and `--allow-same-version` ensures it doesn't fail if a package is already at the target version.

```bash
pnpm -r exec pnpm version <version_or_bump_type> --no-git-tag-version --allow-same-version
```

### 3. Update Root Version

Update the root `package.json` to match the workspace versions.

```bash
pnpm version <version_or_bump_type> --no-git-tag-version --allow-same-version
```

### 4. Update Lockfile and Internal References

Run `pnpm install` to ensure `pnpm-lock.yaml` is updated with the new versions and any internal workspace dependencies (using `workspace:*`) are correctly resolved.

```bash
pnpm install
```

### 5. Verify Changes

Check a sample of `package.json` files to ensure they all reflect the new version.

```bash
grep '"version":' package.json packages/*/package.json packages/plugins/*/package.json
```

## Termination Criteria

- The `version` field in the root `package.json` matches the target version.
- The `version` field in all `packages/**/package.json` files matches the target version.
- `pnpm-lock.yaml` has been updated and there are no linting/test regressions related to the version change.

## Examples

### Scenario: Performing a patch bump across the monorepo

1. **Agent**: "I will bump the version to the next patch."
2. **Command**: `pnpm -r exec pnpm version patch --no-git-tag-version --allow-same-version`
3. **Command**: `pnpm version patch --no-git-tag-version --allow-same-version`
4. **Command**: `pnpm install`
5. **Verification**: `grep '"version":' package.json packages/*/package.json`

### Scenario: Setting an explicit version (e.g., 0.2.0)

1. **Agent**: "Synchronizing all packages to version 0.2.0."
2. **Command**: `pnpm -r exec pnpm version 0.2.0 --no-git-tag-version --allow-same-version`
3. **Command**: `pnpm version 0.2.0 --no-git-tag-version --allow-same-version`
4. **Command**: `pnpm install`
