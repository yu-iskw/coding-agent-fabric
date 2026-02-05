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

echo -e "${GREEN}Integration tests with real skills passed!${NC}"
