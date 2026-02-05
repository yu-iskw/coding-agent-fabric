#!/bin/bash
# Scenario 4: Subagents installation

echo "Scenario: Installing subagents..."

mkdir -p /tmp/repos
cd /tmp/repos

# 1. github-project-skills
if [ ! -d "github-project-skills" ]; then
    git clone --depth 1 https://github.com/yu-iskw/github-project-skills.git
fi

cd /test-workspace
if [ ! -f "/tmp/repos/github-project-skills/package.json" ]; then
    echo '{ "name": "github-project-skills", "version": "1.0.0" }' > /tmp/repos/github-project-skills/package.json
fi
run_caf_cmd "$AGENT" "$SCOPE" skills add /tmp/repos/github-project-skills --yes --force || { echo -e "${RED}Failed to add github-project-skills skills${NC}"; exit 1; }
run_caf_cmd "$AGENT" "$SCOPE" subagents add /tmp/repos/github-project-skills --yes --force || { echo -e "${RED}Failed to add github-project-skills subagents${NC}"; exit 1; }

SKILLS_DIR=$(get_agent_skills_dir "$AGENT" "$SCOPE")
SUBAGENTS_DIR=$(get_agent_subagents_dir "$AGENT" "$SCOPE")
show_structure "$SKILLS_DIR" "Installed Skills (after github-project-skills)"
show_structure "$SUBAGENTS_DIR" "Installed Subagents (after github-project-skills)"

verify_installed "$AGENT" "$SCOPE" "skills" "github-project-skills" "gh-listing-issues"
verify_installed "$AGENT" "$SCOPE" "subagents" "github-project-skills" "github-project-manager"

# 2. meta-agent-skills
cd /tmp/repos
if [ ! -d "meta-agent-skills" ]; then
    git clone --depth 1 https://github.com/yu-iskw/meta-agent-skills.git
fi

cd /test-workspace
if [ ! -f "/tmp/repos/meta-agent-skills/package.json" ]; then
    echo '{ "name": "meta-agent-skills", "version": "1.0.0" }' > /tmp/repos/meta-agent-skills/package.json
fi
run_caf_cmd "$AGENT" "$SCOPE" skills add /tmp/repos/meta-agent-skills --yes --force || { echo -e "${RED}Failed to add meta-agent-skills skills${NC}"; exit 1; }
run_caf_cmd "$AGENT" "$SCOPE" subagents add /tmp/repos/meta-agent-skills --yes --force || { echo -e "${RED}Failed to add meta-agent-skills subagents${NC}"; exit 1; }

SKILLS_DIR=$(get_agent_skills_dir "$AGENT" "$SCOPE")
SUBAGENTS_DIR=$(get_agent_subagents_dir "$AGENT" "$SCOPE")
show_structure "$SKILLS_DIR" "Installed Skills (after meta-agent-skills)"
show_structure "$SUBAGENTS_DIR" "Installed Subagents (after meta-agent-skills)"

verify_installed "$AGENT" "$SCOPE" "skills" "meta-agent-skills" "meta-agent-skills"
verify_installed "$AGENT" "$SCOPE" "subagents" "meta-agent-skills" "maintainer-agent"

# 3. coding-agent-skills
cd /tmp/repos
if [ ! -d "coding-agent-skills" ]; then
    git clone --depth 1 https://github.com/yu-iskw/coding-agent-skills.git
fi

cd /test-workspace
if [ ! -f "/tmp/repos/coding-agent-skills/package.json" ]; then
    echo '{ "name": "coding-agent-skills", "version": "1.0.0" }' > /tmp/repos/coding-agent-skills/package.json
fi
run_caf_cmd "$AGENT" "$SCOPE" skills add /tmp/repos/coding-agent-skills --yes --force || { echo -e "${RED}Failed to add coding-agent-skills${NC}"; exit 1; }
SKILLS_DIR=$(get_agent_skills_dir "$AGENT" "$SCOPE")
show_structure "$SKILLS_DIR" "Installed Skills (after coding-agent-skills)"
verify_installed "$AGENT" "$SCOPE" "skills" "coding-agent-skills" "claude-code-cli"
