#!/bin/bash
# Scenario 7: Shorthand and URL installation

echo "Scenario: Installing via shorthand and URL..."

cd /test-workspace

# 1. GitHub Shorthand
echo "Installing from shorthand (anthropics/skills)..."
run_caf_cmd "$AGENT" "$SCOPE" skills add anthropics/skills --yes --force || { echo -e "${RED}Installation from shorthand failed${NC}"; exit 1; }
SKILLS_DIR=$(get_agent_skills_dir "$AGENT" "$SCOPE")
show_structure "$SKILLS_DIR" "Skills Directory after shorthand"
verify_installed "$AGENT" "$SCOPE" "skills" "anthropics-shorthand" "document-skills\|pdf"

# 2. GitHub URL
echo "Installing from URL (vercel-labs/agent-skills)..."
run_caf_cmd "$AGENT" "$SCOPE" skills add https://github.com/vercel-labs/agent-skills --yes --force || { echo -e "${RED}Installation from URL failed${NC}"; exit 1; }
SKILLS_DIR=$(get_agent_skills_dir "$AGENT" "$SCOPE")
show_structure "$SKILLS_DIR" "Skills Directory after URL"
verify_installed "$AGENT" "$SCOPE" "skills" "vercel-url" "web-design-guidelines"

# 3. Microsoft Skills (URL)
echo "Installing from microsoft/skills URL..."
run_caf_cmd "$AGENT" "$SCOPE" skills add https://github.com/microsoft/skills --yes --force || { echo -e "${RED}Failed to add microsoft/skills via URL${NC}"; exit 1; }
SKILLS_DIR=$(get_agent_skills_dir "$AGENT" "$SCOPE")
show_structure "$SKILLS_DIR" "Skills Directory after Microsoft URL"
verify_installed "$AGENT" "$SCOPE" "skills" "microsoft" "github-skills-azure-cosmos-db-py"
