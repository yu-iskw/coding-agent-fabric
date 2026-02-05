#!/bin/bash
# Scenario 8: Isolation check

echo "Scenario: Isolation check (package.json should not be modified)..."

cd /test-workspace
# We should check if package.json dependencies changed significantly
# Actually, the original test just checked if certain strings appeared in package.json

if grep -q "anthropics/skills" package.json || grep -q "vercel-labs/agent-skills" package.json; then
    echo -e "${RED}package.json was unexpectedly modified for git-based installation${NC}"
    exit 1
fi

show_structure "/test-workspace" "Final Workspace State in Isolation Check"
echo "Isolation check passed."
