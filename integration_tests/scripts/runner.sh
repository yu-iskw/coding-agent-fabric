#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib.sh"

# Parse arguments
VERBOSE=false
AGENT="claude-code"
SCOPE="project"

while [[ $# -gt 0 ]]; do
  case $1 in
    --verbose|-v)
      VERBOSE=true
      shift
      ;;
    --agent|-a)
      AGENT="$2"
      shift 2
      ;;
    --scope|-s)
      SCOPE="$2"
      shift 2
      ;;
    --help|-h)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --verbose, -v    Enable verbose output"
      echo "  --agent, -a      Target agent (claude-code, cursor, etc.)"
      echo "  --scope, -s      Target scope (project, global)"
      echo "  --help, -h       Show this help message"
      exit 0
      ;;
    *)
      shift
      ;;
  esac
done

export VERBOSE
export AGENT
export SCOPE

echo -e "${GREEN}Starting integration tests for $AGENT ($SCOPE)...${NC}"

if [ "$VERBOSE" = true ]; then
  echo -e "${YELLOW}=== Environment Diagnostics ===${NC}"
  debug_log "Agent: $AGENT"
  debug_log "Scope: $SCOPE"
  debug_log "Working directory: $(pwd)"
  debug_log "HOME: $HOME"

  if command -v tree &> /dev/null; then
    debug_log "tree command is available"
  else
    debug_log "tree command is NOT available"
  fi
  echo ""
fi

# Run scenarios
SCENARIO_DIR="$SCRIPT_DIR/../scenarios"
for scenario in "$SCENARIO_DIR"/*.sh; do
  [ -e "$scenario" ] || continue
  source "$scenario" || { echo -e "${RED}Scenario failed: $(basename "$scenario")${NC}"; exit 1; }
done

# Final summary in verbose mode
if [ "$VERBOSE" = true ]; then
  echo -e "${YELLOW}=== Final Test Summary ($AGENT $SCOPE) ===${NC}"
  debug_log "All scenarios completed successfully"

  echo -e "${YELLOW}=== Final Skills List ===${NC}"
  run_caf_cmd "$AGENT" "$SCOPE" skills list

  echo -e "${YELLOW}=== Final Subagents List ===${NC}"
  run_caf_cmd "$AGENT" "$SCOPE" subagents list

  SKILLS_DIR=$(get_agent_skills_dir "$AGENT" "$SCOPE")
  SUBAGENTS_DIR=$(get_agent_subagents_dir "$AGENT" "$SCOPE")

  show_structure "$SKILLS_DIR" "Final Skills Directory Structure ($AGENT $SCOPE)"
  show_structure "$SUBAGENTS_DIR" "Final Subagents Directory Structure ($AGENT $SCOPE)"
  show_structure "/test-workspace" "Final Workspace State ($AGENT $SCOPE)"
fi

echo -e "${GREEN}Integration tests for $AGENT ($SCOPE) passed!${NC}"
