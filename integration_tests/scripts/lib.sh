#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Debug logging function
debug_log() {
  if [ "$VERBOSE" = true ]; then
    echo -e "${BLUE}[DEBUG]${NC} $1"
  fi
}

# Show directory structure
show_structure() {
  local dir="$1"
  local label="$2"

  if [ "$VERBOSE" = true ]; then
    echo -e "${YELLOW}=== $label ===${NC}"
    if [ ! -d "$dir" ]; then
      debug_log "Directory does not exist: $dir"
      return 0
    fi
    if command -v tree &> /dev/null; then
      if ! tree -L 3 -a -C "$dir" 2>/dev/null; then
        ls -la "$dir" 2>/dev/null || echo "Failed to list directory: $dir"
      fi
    else
      debug_log "tree command not available, using ls instead"
      if ! ls -laR "$dir" 2>/dev/null | head -50; then
        echo "Failed to list directory: $dir"
      fi
    fi
    echo ""
  fi
  return 0
}

# Get skills directory for an agent and scope
get_agent_skills_dir() {
  local agent="$1"
  local scope="$2"
  local home_dir="${HOME:-/test-workspace}"

  if [ "$scope" = "global" ]; then
    case "$agent" in
      claude-code) echo "$home_dir/.claude/skills" ;;
      cursor)      echo "$home_dir/.cursor/fabric-skills" ;;
      *)           echo "$home_dir/.$agent/skills" ;;
    esac
  else
    case "$agent" in
      claude-code) echo "/test-workspace/.claude/skills" ;;
      cursor)      echo "/test-workspace/.cursor/fabric-skills" ;;
      *)           echo "/test-workspace/.$agent/skills" ;;
    esac
  fi
}

# Get subagents directory for an agent and scope
get_agent_subagents_dir() {
  local agent="$1"
  local scope="$2"
  local home_dir="${HOME:-/test-workspace}"

  if [ "$scope" = "global" ]; then
    case "$agent" in
      claude-code) echo "$home_dir/.claude/agents" ;;
      cursor)      echo "$home_dir/.cursor/agents" ;;
      *)           echo "$home_dir/.$agent/agents" ;;
    esac
  else
    case "$agent" in
      claude-code) echo "/test-workspace/.claude/agents" ;;
      cursor)      echo "/test-workspace/.cursor/agents" ;;
      *)           echo "/test-workspace/.$agent/agents" ;;
    esac
  fi
}

# Run caf command with agent and scope flags
run_caf_cmd() {
  local agent="$1"
  local scope="$2"
  local cmd="$3"
  local subcmd="$4"
  shift 2
  
  local flags=()
  
  # Only add --agent if it's add or remove
  if [[ "$subcmd" == "add" || "$subcmd" == "remove" ]]; then
    if [ -n "$agent" ]; then
      flags+=("--agent" "$agent")
    fi
  fi

  # Add --global if scope is global
  # Most commands support -g/--global
  if [ "$scope" = "global" ]; then
    flags+=("--global")
  fi

  debug_log "Running: caf $* ${flags[*]}"
  caf "$@" "${flags[@]}"
}

# Check if resource is installed
verify_installed() {
  local agent="$1"
  local scope="$2"
  local type="$3" # skills or subagents
  local name="$4"
  local pattern="$5"

  echo "Verifying $type installation for $agent ($scope): $name..."
  run_caf_cmd "$agent" "$scope" "$type" list | grep -i "$pattern" || {
    echo -e "${RED}$type installation verification failed for $name${NC}"
    exit 1
  }
}
