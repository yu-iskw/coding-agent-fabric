---
name: test-integration-docker
description: Run comprehensive integration tests using real skills (Vercel, Anthropic, Expo) in a Docker container. Managed via Makefile for standard lifecycle control.
---

# Integration Testing with Docker & Real Skills

This skill executes integration tests in a containerized environment using actual skill repositories from the community. It uses a `Makefile` to manage the build and test lifecycle.

## Workflow Checklist

- [ ] **Step 1: Environment Readiness**
  - Verify Docker is running.
- [ ] **Step 2: Execute Tests**
  - Run `make -C integration_tests test` in the project root.
- [ ] **Step 3: Lifecycle Management**
  - Use `make -C integration_tests clean` if needed to prune images.

## Detailed Instructions

### 1. Run Integration Tests

Ensure the Docker daemon is active, then execute the following command from the project root to build the image and run the full test suite:

```bash
make -C integration_tests test
```

### 2. Standard Makefile Targets

You can also use the `Makefile` directly for granular control:

#### Build the image only

```bash
make -C integration_tests build
```

#### Clean up images

```bash
make -C integration_tests clean
```

## Success Criteria

- Docker image builds successfully with `git` and `make` installed.
- `caf` CLI is linked and available in the container.
- Real-world skills are cloned from GitHub (Vercel, Anthropic).
- `caf skills add` successfully installs these real skills.
- All integration scenarios pass.

## Scenarios Covered

1. **CLI Health**: Version and help checks.
2. **Real-World Skills (Vercel)**: Clones `vercel-labs/agent-skills` and installs skills like `web-design-guidelines`.
3. **Real-World Skills (Anthropic)**: Clones `anthropics/skills` and installs document skills.
4. **Subagent Verification**: Lists available subagents in the clean container.
