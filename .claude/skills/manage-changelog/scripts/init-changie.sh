#!/bin/bash
set -e

# Resolve repository root
REPO_ROOT=$(git rev-parse --show-toplevel)

# Check if .changie.yaml already exists in the repo root
if [[ -f "${REPO_ROOT}/.changie.yaml" ]]; then
	echo ".changie.yaml already exists at ${REPO_ROOT}. Skipping initialization."
	exit 0
fi

# Determine the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ASSETS_DIR="$(cd "${SCRIPT_DIR}/../assets" && pwd)"

# Copy the template config to the project root
echo "Initializing Changie at ${REPO_ROOT}..."
cp "${ASSETS_DIR}/dot-changie.yaml" "${REPO_ROOT}/.changie.yaml"

# Create necessary directories
mkdir -p "${REPO_ROOT}/.changes/unreleased"

# Create a default header if it doesn't exist
if [[ ! -f "${REPO_ROOT}/.changes/header.md" ]]; then
	echo "# Changelog" >"${REPO_ROOT}/.changes/header.md"
fi

echo "Changie initialized with the customized configuration."
