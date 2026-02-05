/**
 * MCP (Model Context Protocol) Resource Handler
 *
 * Manages MCP server configurations for agents
 */

import { BaseResourceHandler, type PluginContext } from '@coding-agent-fabric/plugin-api';
import type {
  AgentType,
  Resource,
  InstallTarget,
  ParsedSource,
  InstalledResource,
  ValidationResult,
  DiscoverOptions,
  InstallOptions,
  RemoveOptions,
  Scope,
  ListResult,
  ListError,
} from '@coding-agent-fabric/common';
import { safeJoin } from '@coding-agent-fabric/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * MCP Server metadata
 */
interface MCPServerMetadata {
  serverType: 'stdio' | 'sse' | 'http';
  command?: string; // For stdio servers
  args?: string[];
  env?: Record<string, string>;
  url?: string; // For SSE/HTTP servers
  description: string;
}

/**
 * MCP server configuration
 */
interface MCPServerConfig {
  [serverName: string]: {
    command?: string;
    args?: string[];
    env?: Record<string, string>;
    url?: string;
  };
}

/**
 * MCP configuration file structure
 */
interface MCPConfig {
  mcpServers?: MCPServerConfig;
}

/**
 * MCP Handler
 */
export class MCPHandler extends BaseResourceHandler {
  readonly type = 'mcp';
  readonly displayName = 'MCP Servers';
  readonly description = 'Manages Model Context Protocol (MCP) server configurations';
  readonly isCore = false;

  constructor(private context: PluginContext) {
    super();
  }

  /**
   * Discover MCP servers from a source
   */
  async discover(source: ParsedSource, _options?: DiscoverOptions): Promise<Resource[]> {
    const resources: Resource[] = [];

    // Handle local path discovery
    if (source.type === 'local' && source.localPath) {
      const mcpDir = source.localPath;

      try {
        const entries = await fs.readdir(mcpDir, { withFileTypes: true });

        for (const entry of entries) {
          if (entry.isFile() && entry.name.endsWith('.json')) {
            const mcpPath = safeJoin(mcpDir, entry.name);
            const content = await fs.readFile(mcpPath, 'utf-8');
            const mcpConfig = JSON.parse(content);

            // Parse MCP configuration
            if (mcpConfig.mcpServers) {
              for (const [serverName, serverConfigRaw] of Object.entries(mcpConfig.mcpServers)) {
                const serverConfig = serverConfigRaw as {
                  command?: string;
                  args?: string[];
                  env?: Record<string, string>;
                  url?: string;
                };
                resources.push({
                  type: this.type,
                  name: serverName,
                  description: `MCP server: ${serverName}`,
                  metadata: {
                    serverType: serverConfig.url ? 'sse' : 'stdio',
                    command: serverConfig.command,
                    args: serverConfig.args,
                    env: serverConfig.env,
                    url: serverConfig.url,
                    description: `MCP server: ${serverName}`,
                  } as Record<string, unknown>,
                  files: [
                    {
                      path: `${serverName}.json`,
                      content: JSON.stringify(
                        { mcpServers: { [serverName]: serverConfig } },
                        null,
                        2,
                      ),
                    },
                  ],
                });
              }
            }
          }
        }
      } catch (error) {
        this.context.log.warn(`Failed to discover MCP servers from ${mcpDir}:`, error);
      }
    }

    return resources;
  }

  /**
   * Discover MCP servers from a local directory path
   */
  async discoverFromPath(directory: string, options?: DiscoverOptions): Promise<Resource[]> {
    return this.discover(
      {
        type: 'local',
        url: `file://${directory}`,
        localPath: directory,
      },
      options,
    );
  }

  /**
   * Install an MCP server
   */
  async install(
    resource: Resource,
    targets: InstallTarget[],
    options: InstallOptions,
  ): Promise<void> {
    for (const target of targets) {
      const configPath = this.getConfigPath(target.agent, target.scope);

      // Ensure directory exists
      await fs.mkdir(path.dirname(configPath), { recursive: true });

      // Read existing config or create new
      let existingConfig: MCPConfig = { mcpServers: {} };
      try {
        const content = await fs.readFile(configPath, 'utf-8');
        existingConfig = JSON.parse(content);
        if (!existingConfig.mcpServers) {
          existingConfig.mcpServers = {};
        }
      } catch {
        // File doesn't exist, use empty config
      }

      // Merge new server configuration
      const metadata = resource.metadata as unknown as MCPServerMetadata;
      const serverConfig: Record<string, unknown> = {};

      if (metadata.command) {
        serverConfig.command = metadata.command;
      }
      if (metadata.args) {
        serverConfig.args = metadata.args;
      }
      if (metadata.env) {
        serverConfig.env = metadata.env;
      }
      if (metadata.url) {
        serverConfig.url = metadata.url;
      }

      // Check if server already exists
      if (existingConfig.mcpServers![resource.name] && !options.force) {
        throw new Error(
          `MCP server '${resource.name}' already exists in ${configPath}. Use --force to overwrite.`,
        );
      }

      existingConfig.mcpServers![resource.name] = serverConfig;

      // Write updated config
      await fs.writeFile(configPath, JSON.stringify(existingConfig, null, 2), 'utf-8');
      this.context.audit?.success('install-mcp-server', resource.name, this.type, configPath, {
        agent: target.agent,
        scope: target.scope,
        serverType: metadata.serverType,
      });
    }
  }

  /**
   * Remove an MCP server
   */
  async remove(
    resource: Resource,
    targets: InstallTarget[],
    options: RemoveOptions,
  ): Promise<void> {
    for (const target of targets) {
      const configPath = this.getConfigPath(target.agent, target.scope);

      try {
        const content = await fs.readFile(configPath, 'utf-8');
        const config: MCPConfig = JSON.parse(content);

        if (config.mcpServers && config.mcpServers[resource.name]) {
          delete config.mcpServers[resource.name];

          // Write updated config
          await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
          this.context.audit?.success('remove-mcp-server', resource.name, this.type, configPath, {
            agent: target.agent,
            scope: target.scope,
          });
        } else if (!options.force) {
          this.context.audit?.failure(
            'remove-mcp-server',
            resource.name,
            this.type,
            `MCP server '${resource.name}' not found`,
            configPath,
          );
          throw new Error(`MCP server '${resource.name}' not found in ${configPath}`);
        }
      } catch (error) {
        if (!options.force) {
          this.context.audit?.failure(
            'remove-mcp-server',
            resource.name,
            this.type,
            (error as Error).message,
            configPath,
          );
          throw error;
        }
        this.context.audit?.warning('remove-mcp-server-failed', resource.name, this.type, {
          configPath,
          error: (error as Error).message,
        });
      }
    }
  }

  /**
   * List installed MCP servers
   */
  async list(scope: 'global' | 'project' | 'both'): Promise<ListResult> {
    const resources: InstalledResource[] = [];
    const errors: ListError[] = [];
    const scopes: Scope[] = scope === 'both' ? ['global', 'project'] : [scope];
    const agents = this.getSupportedAgents();

    for (const agent of agents) {
      for (const s of scopes) {
        const configPath = this.getConfigPath(agent, s);

        try {
          const content = await fs.readFile(configPath, 'utf-8');
          const config: MCPConfig = JSON.parse(content);
          const stats = await fs.stat(configPath);

          if (config.mcpServers) {
            for (const [serverName, serverConfigRaw] of Object.entries(config.mcpServers)) {
              const serverConfig = serverConfigRaw as {
                command?: string;
                args?: string[];
                env?: Record<string, string>;
                url?: string;
              };
              resources.push({
                type: this.type,
                name: serverName,
                description: `MCP server: ${serverName}`,
                metadata: {
                  serverType: serverConfig.url ? 'sse' : 'stdio',
                  command: serverConfig.command,
                  args: serverConfig.args,
                  env: serverConfig.env,
                  url: serverConfig.url,
                  description: `MCP server: ${serverName}`,
                } as Record<string, unknown>,
                files: [
                  {
                    path: `${serverName}.json`,
                    content: JSON.stringify(
                      { mcpServers: { [serverName]: serverConfig } },
                      null,
                      2,
                    ),
                  },
                ],
                source: 'local',
                sourceType: 'local',
                sourceUrl: configPath,
                installedAt: stats.birthtime.toISOString(),
                updatedAt: stats.mtime.toISOString(),
                installedFor: [
                  {
                    agent,
                    scope: s,
                    path: configPath,
                  },
                ],
              });
            }
          }
        } catch (error) {
          // Config file doesn't exist is a common case and not an error
          if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            this.context.log.debug(`MCP config file not found at ${configPath}`);
            continue;
          }

          const errorMessage = error instanceof Error ? error.message : String(error);
          this.context.audit?.failure('list', 'mcp', this.type, errorMessage, configPath);

          // For plugins, we don't always have a sanitizePath helper readily available
          // but we can at least try to mask the home directory
          let displayPath = configPath;
          const home = os.homedir();
          if (displayPath.startsWith(home)) {
            displayPath = displayPath.replace(home, '~');
          }

          errors.push({
            agent,
            scope: s,
            error: `Failed to access MCP config at ${displayPath}: ${errorMessage}`,
          });
        }
      }
    }

    return {
      resources,
      errors,
    };
  }

  /**
   * Validate an MCP server configuration
   */
  async validate(resource: Resource): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check metadata
    const metadata = resource.metadata as unknown as MCPServerMetadata;

    if (!metadata.serverType) {
      errors.push('Missing serverType in metadata');
    } else if (!['stdio', 'sse', 'http'].includes(metadata.serverType)) {
      errors.push(`Invalid serverType: ${metadata.serverType}`);
    }

    // Validate stdio servers
    if (metadata.serverType === 'stdio') {
      if (!metadata.command) {
        errors.push('stdio servers must specify a command');
      }
    }

    // Validate SSE/HTTP servers
    if (metadata.serverType === 'sse' || metadata.serverType === 'http') {
      if (!metadata.url) {
        errors.push(`${metadata.serverType} servers must specify a url`);
      }
    }

    // Check files
    if (!resource.files || resource.files.length === 0) {
      errors.push('No files specified');
    } else {
      for (const file of resource.files) {
        if (!file.content) {
          warnings.push(`File ${file.path} has no content`);
          continue;
        }

        try {
          JSON.parse(file.content);
        } catch (error) {
          errors.push(`Invalid JSON in ${file.path}: ${error}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get supported agents
   */
  getSupportedAgents(): AgentType[] {
    return ['claude-code', 'cursor', 'codex'];
  }

  /**
   * Get installation path for an agent
   */
  getInstallPath(agent: AgentType, scope: Scope): string {
    // MCP uses config files, not directories
    return path.dirname(this.getConfigPath(agent, scope));
  }

  /**
   * Get configuration file path for an agent
   */
  private getConfigPath(agent: AgentType, scope: Scope): string {
    const supportedAgents = this.getSupportedAgents();
    if (!supportedAgents.includes(agent)) {
      throw new Error(`Unsupported agent: ${agent}`);
    }

    const _configFileName = agent === 'claude-code' ? 'settings.json' : 'mcp.json';

    if (scope === 'global') {
      switch (agent) {
        case 'claude-code':
          return path.join(os.homedir(), '.claude', 'settings.json');
        case 'cursor':
          return path.join(os.homedir(), '.cursor', 'mcp.json');
        case 'codex':
          return path.join(os.homedir(), '.codex', 'mcp.json');
        default:
          throw new Error(`Unknown agent: ${agent}`);
      }
    } else {
      // Project scope
      switch (agent) {
        case 'claude-code':
          return path.join(process.cwd(), '.claude', 'settings.json');
        case 'cursor':
          return path.join(process.cwd(), '.cursor', 'mcp.json');
        case 'codex':
          return path.join(process.cwd(), '.codex', 'mcp.json');
        default:
          throw new Error(`Unknown agent: ${agent}`);
      }
    }
  }
}
