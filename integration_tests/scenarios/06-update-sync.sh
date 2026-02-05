#!/bin/bash
# Scenario 6: Update/Sync local mock resources

echo "Scenario: Updating/Syncing resources..."

# 1. Skill update
mkdir -p /tmp/mock-skill
echo '{ "name": "mock-skill", "version": "1.0.0" }' > /tmp/mock-skill/package.json
echo "# mock-skill v1" > /tmp/mock-skill/SKILL.md

cd /test-workspace
run_caf_cmd "$AGENT" "$SCOPE" skills add /tmp/mock-skill --yes --force || { echo -e "${RED}Failed to add mock skill${NC}"; exit 1; }
run_caf_cmd "$AGENT" "$SCOPE" skills list | grep "mock-skill" || { echo -e "${RED}Mock skill installation failed${NC}"; exit 1; }

# Modify source
echo "# mock-skill v2" > /tmp/mock-skill/SKILL.md
run_caf_cmd "$AGENT" "$SCOPE" skills add /tmp/mock-skill --yes --force || { echo -e "${RED}Failed to update mock skill${NC}"; exit 1; }
SKILLS_DIR=$(get_agent_skills_dir "$AGENT" "$SCOPE")
show_structure "$SKILLS_DIR" "Skills Directory after sync"
run_caf_cmd "$AGENT" "$SCOPE" skills list | grep "mock-skill" || { echo -e "${RED}Mock skill update verification failed${NC}"; exit 1; }

# 2. Subagent update
mkdir -p /tmp/mock-subagent
echo '{ "name": "mock-subagent-pkg", "version": "1.0.0" }' > /tmp/mock-subagent/package.json
echo '{ "name": "mock-subagent", "description": "Mock description v1" }' > /tmp/mock-subagent/subagent.json

run_caf_cmd "$AGENT" "$SCOPE" subagents add /tmp/mock-subagent --yes --force || { echo -e "${RED}Failed to add mock subagent${NC}"; exit 1; }
run_caf_cmd "$AGENT" "$SCOPE" subagents list | grep "mock-subagent" || { echo -e "${RED}Mock subagent installation failed${NC}"; exit 1; }

# Modify source
echo '{ "name": "mock-subagent", "description": "Mock description v2" }' > /tmp/mock-subagent/subagent.json
run_caf_cmd "$AGENT" "$SCOPE" subagents add /tmp/mock-subagent --yes --force || { echo -e "${RED}Failed to update mock subagent${NC}"; exit 1; }
SUBAGENTS_DIR=$(get_agent_subagents_dir "$AGENT" "$SCOPE")
show_structure "$SUBAGENTS_DIR" "Subagents Directory after sync"
run_caf_cmd "$AGENT" "$SCOPE" subagents list | grep "mock-subagent" || { echo -e "${RED}Mock subagent update verification failed${NC}"; exit 1; }
