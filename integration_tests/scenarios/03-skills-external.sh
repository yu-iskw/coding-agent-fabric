#!/bin/bash
# Scenario 3: External skills installation

echo "Scenario: Installing external skills..."

mkdir -p /tmp/repos
cd /tmp/repos

# 1. Vercel
if [ ! -d "agent-skills" ]; then
    debug_log "Cloning vercel-labs/agent-skills"
    git clone --depth 1 https://github.com/vercel-labs/agent-skills.git
fi
show_structure "/tmp/repos/agent-skills" "Vercel Skills"

cd /test-workspace
if [ ! -f "/tmp/repos/agent-skills/package.json" ]; then
    echo '{ "name": "vercel-skills", "version": "1.0.0" }' > /tmp/repos/agent-skills/package.json
fi
run_caf_cmd "$AGENT" "$SCOPE" skills add /tmp/repos/agent-skills --yes --force || { echo -e "${RED}Failed to add vercel-labs skills${NC}"; exit 1; }
SKILLS_DIR=$(get_agent_skills_dir "$AGENT" "$SCOPE")
show_structure "$SKILLS_DIR" "Installed Skills Structure (after Vercel)"
verify_installed "$AGENT" "$SCOPE" "skills" "vercel-labs" "web-design-guidelines"

# 2. Anthropic
cd /tmp/repos
if [ ! -d "skills" ]; then
    debug_log "Cloning anthropics/skills"
    git clone --depth 1 https://github.com/anthropics/skills.git
fi
show_structure "/tmp/repos/skills" "Anthropic Skills"

cd /test-workspace
if [ ! -f "/tmp/repos/skills/package.json" ]; then
    echo '{ "name": "anthropic-skills", "version": "1.0.0" }' > /tmp/repos/skills/package.json
fi
run_caf_cmd "$AGENT" "$SCOPE" skills add /tmp/repos/skills --yes --force || { echo -e "${RED}Failed to add anthropic skills${NC}"; exit 1; }
SKILLS_DIR=$(get_agent_skills_dir "$AGENT" "$SCOPE")
show_structure "$SKILLS_DIR" "Installed Skills Structure (after Anthropic)"
verify_installed "$AGENT" "$SCOPE" "skills" "anthropic" "document-skills\|pdf"
