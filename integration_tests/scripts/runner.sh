#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting integration tests with real skills...${NC}"

# 1. Check CLI availability
echo "Scenario 1: Checking CLI version..."
caf --version || { echo -e "${RED}CLI version check failed${NC}"; exit 1; }

# 2. Check help
echo "Scenario 2: Checking help command..."
caf --help > /dev/null || { echo -e "${RED}CLI help command failed${NC}"; exit 1; }

# 3. Initialize test workspace
echo "Scenario 3: Initializing test workspace..."
cd /test-workspace
pnpm init > /dev/null

# 4. List skills
echo "Scenario 4: Listing skills (should be empty initially)..."
caf skills list | grep "No skills installed" || { echo -e "${RED}Initial skills list not empty${NC}"; exit 1; }

# 5. Install real skills from Vercel
echo "Scenario 5: Installing real skills from vercel-labs/agent-skills..."
mkdir -p /tmp/repos
cd /tmp/repos
git clone --depth 1 https://github.com/vercel-labs/agent-skills.git

echo "Adding skills from vercel-labs/agent-skills..."
# Return to workspace
cd /test-workspace
# Try adding the whole repo if it has a package.json, otherwise we might need to point to specific skill subdirs
# For vercel-labs/agent-skills, let's see if we can just point to the skills directory if it doesn't have a root package.json
if [ -f "/tmp/repos/agent-skills/package.json" ]; then
    caf skills add /tmp/repos/agent-skills --yes || { echo -e "${RED}Failed to add vercel-labs skills from root${NC}"; exit 1; }
else
    # If no root package.json, we might need to point to the skills directory
    # Our current implementation of addSkills uses pnpmAdd which requires a package.json
    # So we might need to create a dummy package.json at the root of the cloned repo if it's missing
    echo '{ "name": "vercel-skills", "version": "1.0.0" }' > /tmp/repos/agent-skills/package.json
    caf skills add /tmp/repos/agent-skills --yes || { echo -e "${RED}Failed to add vercel-labs skills from root (with dummy package.json)${NC}"; exit 1; }
fi

echo "Verifying vercel skill installation..."
caf skills list | grep "web-design-guidelines" || { echo -e "${RED}Vercel skill installation verification failed${NC}"; exit 1; }

# 6. Install real skills from Anthropic
echo "Scenario 6: Installing real skills from anthropics/skills..."
cd /tmp/repos
git clone --depth 1 https://github.com/anthropics/skills.git

echo "Adding skills from anthropics/skills..."
cd /test-workspace
if [ ! -f "/tmp/repos/skills/package.json" ]; then
    echo '{ "name": "anthropic-skills", "version": "1.0.0" }' > /tmp/repos/skills/package.json
fi
caf skills add /tmp/repos/skills --yes || { echo -e "${RED}Failed to add anthropic skills${NC}"; exit 1; }

echo "Verifying anthropic skill installation..."
caf skills list | grep "document-skills" || caf skills list | grep -i "pdf" || { echo -e "${RED}Anthropic skill installation verification failed${NC}"; exit 1; }

# 7. Check subagents list
echo "Scenario 7: Checking subagents list..."
caf subagents list || { echo -e "${RED}Subagents list command failed${NC}"; exit 1; }

# 8. Install real skills from yu-iskw/github-project-skills
echo "Scenario 8: Installing real skills from yu-iskw/github-project-skills..."
cd /tmp/repos
git clone --depth 1 https://github.com/yu-iskw/github-project-skills.git

echo "Adding skills from github-project-skills..."
cd /test-workspace
if [ ! -f "/tmp/repos/github-project-skills/package.json" ]; then
    echo '{ "name": "github-project-skills", "version": "1.0.0" }' > /tmp/repos/github-project-skills/package.json
fi
caf skills add /tmp/repos/github-project-skills --yes --force || { echo -e "${RED}Failed to add github-project-skills skills${NC}"; exit 1; }
caf subagents add /tmp/repos/github-project-skills --yes --force || { echo -e "${RED}Failed to add github-project-skills subagents${NC}"; exit 1; }

echo "Verifying github-project-skills installation..."
caf skills list | grep "gh-listing-issues" || { echo -e "${RED}github-project-skills skill verification failed${NC}"; exit 1; }
caf subagents list | grep "github-project-manager" || { echo -e "${RED}github-project-skills subagent verification failed${NC}"; exit 1; }

# 9. Install real skills from yu-iskw/meta-agent-skills
echo "Scenario 9: Installing real skills from yu-iskw/meta-agent-skills..."
cd /tmp/repos
git clone --depth 1 https://github.com/yu-iskw/meta-agent-skills.git

echo "Adding skills from meta-agent-skills..."
cd /test-workspace
if [ ! -f "/tmp/repos/meta-agent-skills/package.json" ]; then
    echo '{ "name": "meta-agent-skills", "version": "1.0.0" }' > /tmp/repos/meta-agent-skills/package.json
fi
caf skills add /tmp/repos/meta-agent-skills --yes --force || { echo -e "${RED}Failed to add meta-agent-skills skills${NC}"; exit 1; }
caf subagents add /tmp/repos/meta-agent-skills --yes --force || { echo -e "${RED}Failed to add meta-agent-skills subagents${NC}"; exit 1; }

echo "Verifying meta-agent-skills installation..."
caf skills list | grep "meta-agent-skills" || { echo -e "${RED}meta-agent-skills verification failed${NC}"; exit 1; }
caf subagents list | grep "maintainer-agent" || { echo -e "${RED}meta-agent-skills subagent verification failed${NC}"; exit 1; }

# 10. Install real skills from yu-iskw/coding-agent-skills
echo "Scenario 10: Installing real skills from yu-iskw/coding-agent-skills..."
cd /tmp/repos
git clone --depth 1 https://github.com/yu-iskw/coding-agent-skills.git

echo "Adding skills from coding-agent-skills..."
cd /test-workspace
if [ ! -f "/tmp/repos/coding-agent-skills/package.json" ]; then
    echo '{ "name": "coding-agent-skills", "version": "1.0.0" }' > /tmp/repos/coding-agent-skills/package.json
fi
caf skills add /tmp/repos/coding-agent-skills --yes --force || { echo -e "${RED}Failed to add coding-agent-skills${NC}"; exit 1; }

echo "Verifying coding-agent-skills installation..."
caf skills list | grep "claude-code-cli" || { echo -e "${RED}coding-agent-skills verification failed${NC}"; exit 1; }

# 11. Remove a skill
echo "Scenario 11: Removing a skill..."
# Create a dedicated mock skill for removal to avoid issues with duplicates from other scenarios
mkdir -p /tmp/removal-skill
cat > /tmp/removal-skill/package.json <<EOF
{
  "name": "removal-skill",
  "version": "1.0.0"
}
EOF
cat > /tmp/removal-skill/SKILL.md <<EOF
# removal-skill
To be removed.
EOF
cd /test-workspace
caf skills add /tmp/removal-skill --yes --force || { echo -e "${RED}Failed to add removal skill${NC}"; exit 1; }
caf skills list | grep "removal-skill" || { echo -e "${RED}Removal skill installation failed${NC}"; exit 1; }

caf skills remove removal-skill --yes --force || { echo -e "${RED}Failed to remove skill${NC}"; exit 1; }
if caf skills list | grep -q "removal-skill"; then
    echo -e "${RED}Skill removal verification failed: removal-skill still present${NC}"
    exit 1
fi

# 12. Remove a subagent
echo "Scenario 12: Removing a subagent..."
# Create a dedicated mock subagent for removal
mkdir -p /tmp/removal-subagent
cat > /tmp/removal-subagent/package.json <<EOF
{
  "name": "removal-subagent-pkg",
  "version": "1.0.0"
}
EOF
cat > /tmp/removal-subagent/subagent.json <<EOF
{
  "name": "removal-subagent",
  "description": "To be removed."
}
EOF
caf subagents add /tmp/removal-subagent --yes --force || { echo -e "${RED}Failed to add removal subagent${NC}"; exit 1; }
caf subagents list | grep "removal-subagent" || { echo -e "${RED}Removal subagent installation failed${NC}"; exit 1; }

caf subagents remove removal-subagent --yes --force || { echo -e "${RED}Failed to remove subagent${NC}"; exit 1; }
if caf subagents list | grep -q "removal-subagent"; then
    echo -e "${RED}Subagent removal verification failed: removal-subagent still present${NC}"
    echo "Current subagents list:"
    caf subagents list
    exit 1
fi

# 13. Update/Sync Skill (Local mock)
echo "Scenario 13: Updating/Syncing a skill..."
mkdir -p /tmp/mock-skill
cat > /tmp/mock-skill/package.json <<EOF
{
  "name": "mock-skill",
  "version": "1.0.0"
}
EOF
cat > /tmp/mock-skill/SKILL.md <<EOF
# mock-skill
Description v1
EOF
cd /test-workspace
caf skills add /tmp/mock-skill --yes --force || { echo -e "${RED}Failed to add mock skill${NC}"; exit 1; }
caf skills list | grep "mock-skill" || { echo -e "${RED}Mock skill installation failed${NC}"; exit 1; }

# Modify source
cat > /tmp/mock-skill/SKILL.md <<EOF
# mock-skill
Description v2
EOF
# Re-add with force to sync
caf skills add /tmp/mock-skill --yes --force || { echo -e "${RED}Failed to update mock skill${NC}"; exit 1; }
caf skills list | grep "mock-skill" || { echo -e "${RED}Mock skill update verification failed${NC}"; exit 1; }

# 14. Update/Sync Subagent (Local mock)
echo "Scenario 14: Updating/Syncing a subagent..."
mkdir -p /tmp/mock-subagent
cat > /tmp/mock-subagent/package.json <<EOF
{
  "name": "mock-subagent-pkg",
  "version": "1.0.0"
}
EOF
cat > /tmp/mock-subagent/subagent.json <<EOF
{
  "name": "mock-subagent",
  "description": "Mock description v1"
}
EOF
caf subagents add /tmp/mock-subagent --yes --force || { echo -e "${RED}Failed to add mock subagent${NC}"; exit 1; }
caf subagents list | grep "mock-subagent" || { echo -e "${RED}Mock subagent installation failed${NC}"; exit 1; }

# Modify source
cat > /tmp/mock-subagent/subagent.json <<EOF
{
  "name": "mock-subagent",
  "description": "Mock description v2"
}
EOF
# Re-add with force to sync
caf subagents add /tmp/mock-subagent --yes --force || { echo -e "${RED}Failed to update mock subagent${NC}"; exit 1; }
caf subagents list | grep "mock-subagent" || { echo -e "${RED}Mock subagent update verification failed${NC}"; exit 1; }

# 15. Install via GitHub Shorthand
echo "Scenario 15: Installing via GitHub Shorthand (anthropics/skills)..."
caf skills add anthropics/skills --yes --force || { echo -e "${RED}Installation from shorthand failed${NC}"; exit 1; }
caf skills list | grep "document-skills" || caf skills list | grep -i "pdf" || { echo -e "${RED}Shorthand installation verification failed${NC}"; exit 1; }

# 16. Install via GitHub URL
echo "Scenario 16: Installing via GitHub URL (vercel-labs/agent-skills)..."
caf skills add https://github.com/vercel-labs/agent-skills --yes --force || { echo -e "${RED}Installation from URL failed${NC}"; exit 1; }
caf skills list | grep "web-design-guidelines" || { echo -e "${RED}URL installation verification failed${NC}"; exit 1; }

# 17. Verify that package.json was NOT modified by git-based adds
echo "Scenario 17: Verifying package.json was not modified for git-based adds..."
# Since these are git clones to temp dirs and then installed via handler, 
# they shouldn't trigger pnpmAdd which modifies package.json
if grep -q "anthropics/skills" /test-workspace/package.json || grep -q "vercel-labs/agent-skills" /test-workspace/package.json; then
    echo -e "${RED}package.json was unexpectedly modified for git-based installation${NC}"
    exit 1
fi

echo -e "${GREEN}Integration tests with real skills passed!${NC}"
