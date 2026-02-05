#!/bin/bash
# Scenario 2: Workspace initialization

echo "Scenario: Initializing test workspace..."
# Clean workspace for each run if needed, but normally handled by orchestrator
cd /test-workspace
if [ ! -f "package.json" ]; then
    pnpm init > /dev/null
fi
debug_log "Test workspace at $(pwd)"
show_structure "/test-workspace" "Workspace after init"

echo "Checking initial skills list (should be empty)..."
run_caf_cmd "$AGENT" "$SCOPE" skills list | grep "No skills installed" || { echo -e "${RED}Initial skills list not empty${NC}"; exit 1; }
