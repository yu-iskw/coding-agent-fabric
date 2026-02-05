# Parallel Execution Patterns

## Overview

This reference documents patterns for executing tasks in parallel using Claude Code's Task tool with background agents.

## Core Concepts

### Task Independence

Tasks are independent when:

- They modify different files
- They don't share mutable state
- Output of one is not input to another

### File Ownership

Each file should be "owned" by exactly one parallel task:

```text
✓ Good: Task A owns packages/a/src/api.ts, Task B owns packages/b/src/db.ts
✗ Bad: Task A and B both modify packages/shared/src/utils.ts
```

### Execution Phases

Group tasks into phases:

- **Same phase**: Tasks run in parallel (must be independent)
- **Different phases**: Tasks run sequentially (can have dependencies)

## Patterns

### Pattern 1: Package-Based Parallelism

Split work by pnpm package:

```text
Phase 1 (Parallel):
├── Agent A: packages/api/*
├── Agent B: packages/db/*
└── Agent C: packages/shared/*

Phase 2 (Sequential):
└── Agent D: Integration tests
```

### Pattern 2: Layer-Based Parallelism

Split work by software layer:

```text
Phase 1 (Sequential):
└── Agent A: Implementation (src/)

Phase 2 (Parallel):
├── Agent B: Tests (tests/)
├── Agent C: Documentation (docs/)
└── Agent D: Configuration (config/)
```

### Pattern 3: Feature-Based Parallelism

Split work by independent features:

```text
Phase 1 (Parallel):
├── Agent A: Feature X (all X-related files)
├── Agent B: Feature Y (all Y-related files)
└── Agent C: Feature Z (all Z-related files)

Phase 2 (Sequential):
└── Agent D: Integration tests
```

## Conflict Prevention

### Pre-Execution Validation

Before launching parallel tasks, verify:

```python
# Pseudo-code
files_by_task = {task_id: task.files for task in parallel_tasks}
all_files = []
for task_id, files in files_by_task.items():
    for file in files:
        if file in all_files:
            raise ConflictError(f"{file} assigned to multiple tasks")
        all_files.append(file)
```

### Runtime Detection

If a worker agent needs a file not assigned:

1. Stop immediately
2. Report the conflict
3. Re-plan with correct file assignments

## Best Practices

1. ✓ Maximize parallelism by identifying independent work
2. ✓ Assign clear file ownership to each task
3. ✓ Use detailed prompts so agents work independently
4. ✓ Verify file boundaries before execution
5. ✓ Run verification after all phases complete
