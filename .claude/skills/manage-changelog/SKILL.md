---
name: manage-changelog
description: Manage changelogs using Changie. Provides tools to initialize, add change fragments, batch releases, and merge version notes. Requires 'changie' to be installed.
---

# Manage Changelog Skill

This skill enables the agent to manage project changelogs efficiently using [Changie](https://github.com/miniscruff/changie). It supports the full lifecycle from initialization to release.

## When to Use

- When you need to initialize a changelog for a new project.
- When you want to record a change (feature, bug fix, etc.) after completing a task.
- When preparing for a new release and batching unreleased changes.

## Instructions

### 1. Initialization

If the project doesn't have `changie` set up, run the initialization script:

```bash
.claude/skills/manage-changelog/scripts/init-changie.sh
```

This will create `.changie.yaml` with standard workspace settings.

### 2. Adding Changes

To add a new change fragment:

```bash
changie new --kind <kind> --body "<description>"
```

- **Kinds**: Typically `feat`, `fix`, `docs`, `refactor`, `test`, `chore`.
- **Helper Script**: Alternatively, use `.claude/skills/manage-changelog/scripts/add-from-last-commit.sh` to create a fragment from the last commit message.

### 3. Batching a Release

When you are ready to create a new version:

```bash
# Preview next version
changie next auto

# Batch unreleased changes into a version
changie batch auto
```

### 4. Merging into CHANGELOG.md

To update the main `CHANGELOG.md` file:

```bash
changie merge
```

## References

- [Changie Documentation](https://github.com/miniscruff/changie)
