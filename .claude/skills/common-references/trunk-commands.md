# Trunk CLI Reference

This document provides a summary of common Trunk commands used for linting and formatting.

## Core Commands

- `trunk check`: Runs all enabled linters on the changed files.
- `trunk fmt`: Runs all enabled formatters on the changed files.
- `trunk check --all`: Runs linters on all files in the repository.
- `trunk fmt --all`: Runs formatters on all files in the repository.

## Filtering and Scoping

- `trunk check --scope <name>`: Runs only the linters in the specified scope (e.g., `security`).
- `trunk check --filter <linter>`: Runs only the specified linter.

## Troubleshooting

If `trunk check` fails due to environment issues, ensure that the required runtimes (e.g., Node.js, Python) are installed and accessible as defined in `.trunk/trunk.yaml`.
