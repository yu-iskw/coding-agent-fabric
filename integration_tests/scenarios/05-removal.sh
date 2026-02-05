#!/bin/bash
# Scenario 5: Removal of resources

echo "Scenario: Removing resources..."

# 1. Skill removal
mkdir -p /tmp/removal-skill
echo '{ "name": "removal-skill", "version": "1.0.0" }' > /tmp/removal-skill/package.json
echo "# removal-skill" > /tmp/removal-skill/SKILL.md

cd /test-workspace
run_caf_cmd "$AGENT" "$SCOPE" skills add /tmp/removal-skill --yes --force || { echo -e "${RED}Failed to add removal skill${NC}"; exit 1; }
run_caf_cmd "$AGENT" "$SCOPE" skills list | grep "removal-skill" || { echo -e "${RED}Removal skill installation failed${NC}"; exit 1; }

run_caf_cmd "$AGENT" "$SCOPE" skills remove removal-skill --yes --force || { echo -e "${RED}Failed to remove skill${NC}"; exit 1; }
SKILLS_DIR=$(get_agent_skills_dir "$AGENT" "$SCOPE")
show_structure "$SKILLS_DIR" "Skills Directory after removal"

if run_caf_cmd "$AGENT" "$SCOPE" skills list | grep -q "removal-skill"; then
    echo -e "${RED}Skill removal verification failed: removal-skill still present${NC}"
    exit 1
fi

# 2. Subagent removal
mkdir -p /tmp/removal-subagent
echo '{ "name": "removal-subagent-pkg", "version": "1.0.0" }' > /tmp/removal-subagent/package.json
echo '{ "name": "removal-subagent", "description": "To be removed." }' > /tmp/removal-subagent/subagent.json

cd /test-workspace
run_caf_cmd "$AGENT" "$SCOPE" subagents add /tmp/removal-subagent --yes --force || { echo -e "${RED}Failed to add removal subagent${NC}"; exit 1; }
run_caf_cmd "$AGENT" "$SCOPE" subagents list | grep "removal-subagent" || { echo -e "${RED}Removal subagent installation failed${NC}"; exit 1; }

run_caf_cmd "$AGENT" "$SCOPE" subagents remove removal-subagent --yes --force || { echo -e "${RED}Failed to remove subagent${NC}"; exit 1; }
SUBAGENTS_DIR=$(get_agent_subagents_dir "$AGENT" "$SCOPE")
show_structure "$SUBAGENTS_DIR" "Subagents Directory after removal"

if run_caf_cmd "$AGENT" "$SCOPE" subagents list | grep -q "removal-subagent"; then
    echo -e "${RED}Subagent removal verification failed: removal-subagent still present${NC}"
    exit 1
fi
