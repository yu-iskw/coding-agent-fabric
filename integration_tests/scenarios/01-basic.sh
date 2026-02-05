#!/bin/bash
# Scenario 1: Basic CLI checks

echo "Scenario: Basic CLI checks..."
run_caf_cmd "$AGENT" "$SCOPE" --version || { echo -e "${RED}CLI version check failed${NC}"; exit 1; }
run_caf_cmd "$AGENT" "$SCOPE" --help > /dev/null || { echo -e "${RED}CLI help command failed${NC}"; exit 1; }
show_structure "/test-workspace" "Workspace after basic checks"
