# @agentkit/plugin-mcp

Plugin for managing Model Context Protocol (MCP) servers.

## Overview

This plugin enables installation and management of MCP server configurations for various coding agents. MCP servers provide additional context and capabilities to AI coding assistants.

## Supported Agents

- `claude-code`
- `cursor`
- `codex`

## Server Types

- **stdio**: Servers that communicate via standard input/output
- **sse**: Servers that use Server-Sent Events
- **http**: Servers that use HTTP protocol

## MCP Configuration Format

MCP servers are configured in JSON format:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/files"],
      "env": {
        "NODE_ENV": "production"
      }
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "remote-server": {
      "url": "https://mcp-server.example.com"
    }
  }
}
```

## Configuration Paths

### Claude Code

- **Global**: `~/.claude/settings.json`
- **Project**: `./.claude/settings.json`

### Cursor

- **Global**: `~/.cursor/mcp.json`
- **Project**: `./.cursor/mcp.json`

### Codex

- **Global**: `~/.codex/mcp.json`
- **Project**: `./.codex/mcp.json`

## Usage

```bash
# Install an MCP server
caf install local:./path/to/mcp-config --type mcp --agent claude-code

# List installed MCP servers
caf list --type mcp

# Remove an MCP server
caf remove server-name --type mcp --agent claude-code
```

## Example Configurations

### Filesystem Server (stdio)

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/username/projects"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### GitHub Server (stdio with auth)

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

### Remote Server (SSE)

```json
{
  "mcpServers": {
    "remote": {
      "url": "https://mcp.example.com/sse"
    }
  }
}
```

### Database Server (stdio with connection)

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "postgresql://user:pass@localhost/db"
      }
    }
  }
}
```

## Environment Variables

Environment variables in MCP configurations can use shell-style variable substitution:

- `${VAR_NAME}`: Substitutes the value of the environment variable
- Variables are resolved at runtime by the agent

## Best Practices

1. **Use environment variables** for sensitive data like API tokens
2. **Restrict filesystem access** to only necessary directories
3. **Test servers locally** before deploying globally
4. **Document server purposes** in configuration comments (if supported)
5. **Version control project configs** but exclude sensitive global configs
