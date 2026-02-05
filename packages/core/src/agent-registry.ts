/**
 * AgentRegistry - Manages agent configurations and detection
 */

import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { AgentConfig, AgentType } from '@coding-agent-fabric/common';

/**
 * AgentRegistry manages agent configurations and detection
 */
export class AgentRegistry {
  private agents: Map<AgentType, AgentConfig>;
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.agents = new Map();
    this.registerDefaultAgents();
  }

  /**
   * Register default agent configurations
   */
  private registerDefaultAgents(): void {
    // Claude Code
    this.register({
      name: 'claude-code',
      displayName: 'Claude Code',
      skillsDir: join(this.projectRoot, '.claude', 'skills'),
      globalSkillsDir: join(homedir(), '.claude', 'skills'),
      rulesDir: join(this.projectRoot, '.claude', 'rules'),
      globalRulesDir: join(homedir(), '.claude', 'rules'),
      hooksDir: join(this.projectRoot, '.claude', 'hooks'),
      globalHooksDir: join(homedir(), '.claude', 'hooks'),
      subagentsDir: join(this.projectRoot, '.claude', 'agents'),
      globalSubagentsDir: join(homedir(), '.claude', 'agents'),
      mcpConfigFile: join(this.projectRoot, '.claude', 'mcp.json'),
      globalMcpConfigFile: join(homedir(), '.claude', 'mcp.json'),
      detectInstalled: async () => {
        return (
          existsSync(join(this.projectRoot, '.claude')) || existsSync(join(homedir(), '.claude'))
        );
      },
    });

    // Cursor
    this.register({
      name: 'cursor',
      displayName: 'Cursor',
      skillsDir: join(this.projectRoot, '.cursor', 'fabric-skills'),
      globalSkillsDir: join(homedir(), '.cursor', 'fabric-skills'),
      rulesDir: join(this.projectRoot, '.cursor', 'rules'),
      globalRulesDir: join(homedir(), '.cursor', 'rules'),
      hooksDir: join(this.projectRoot, '.cursor', 'hooks'),
      globalHooksDir: join(homedir(), '.cursor', 'hooks'),
      subagentsDir: join(this.projectRoot, '.cursor', 'agents'),
      globalSubagentsDir: join(homedir(), '.cursor', 'agents'),
      mcpConfigFile: join(this.projectRoot, '.cursor', 'mcp.json'),
      globalMcpConfigFile: join(homedir(), '.cursor', 'mcp.json'),
      detectInstalled: async () => {
        return (
          existsSync(join(this.projectRoot, '.cursor')) || existsSync(join(homedir(), '.cursor'))
        );
      },
    });

    // Gemini CLI (Codex)
    this.register({
      name: 'codex',
      displayName: 'Gemini CLI (Codex)',
      skillsDir: join(this.projectRoot, '.codex', 'skills'),
      globalSkillsDir: join(homedir(), '.codex', 'skills'),
      rulesDir: join(this.projectRoot, '.codex', 'rules'),
      globalRulesDir: join(homedir(), '.codex', 'rules'),
      hooksDir: join(this.projectRoot, '.codex', 'hooks'),
      globalHooksDir: join(homedir(), '.codex', 'hooks'),
      subagentsDir: join(this.projectRoot, '.codex', 'agents'),
      globalSubagentsDir: join(homedir(), '.codex', 'agents'),
      mcpConfigFile: join(this.projectRoot, '.codex', 'mcp.json'),
      globalMcpConfigFile: join(homedir(), '.codex', 'mcp.json'),
      detectInstalled: async () => {
        return (
          existsSync(join(this.projectRoot, '.codex')) || existsSync(join(homedir(), '.codex'))
        );
      },
    });

    // Windsurf
    this.register({
      name: 'windsurf',
      displayName: 'Windsurf',
      skillsDir: join(this.projectRoot, '.windsurf', 'fabric-skills'),
      globalSkillsDir: join(homedir(), '.windsurf', 'fabric-skills'),
      rulesDir: join(this.projectRoot, '.windsurf', 'rules'),
      globalRulesDir: join(homedir(), '.windsurf', 'rules'),
      hooksDir: join(this.projectRoot, '.windsurf', 'hooks'),
      globalHooksDir: join(homedir(), '.windsurf', 'hooks'),
      subagentsDir: join(this.projectRoot, '.windsurf', 'agents'),
      globalSubagentsDir: join(homedir(), '.windsurf', 'agents'),
      mcpConfigFile: join(this.projectRoot, '.windsurf', 'mcp.json'),
      globalMcpConfigFile: join(homedir(), '.windsurf', 'mcp.json'),
      detectInstalled: async () => {
        return (
          existsSync(join(this.projectRoot, '.windsurf')) ||
          existsSync(join(homedir(), '.windsurf'))
        );
      },
    });

    // Aider
    this.register({
      name: 'aider',
      displayName: 'Aider',
      skillsDir: join(this.projectRoot, '.aider', 'skills'),
      globalSkillsDir: join(homedir(), '.aider', 'skills'),
      rulesDir: join(this.projectRoot, '.aider', 'rules'),
      globalRulesDir: join(homedir(), '.aider', 'rules'),
      subagentsDir: join(this.projectRoot, '.aider', 'agents'),
      globalSubagentsDir: join(homedir(), '.aider', 'agents'),
      detectInstalled: async () => {
        return (
          existsSync(join(this.projectRoot, '.aider')) || existsSync(join(homedir(), '.aider'))
        );
      },
    });

    // Continue
    this.register({
      name: 'continue',
      displayName: 'Continue',
      skillsDir: join(this.projectRoot, '.continue', 'skills'),
      globalSkillsDir: join(homedir(), '.continue', 'skills'),
      rulesDir: join(this.projectRoot, '.continue', 'rules'),
      globalRulesDir: join(homedir(), '.continue', 'rules'),
      hooksDir: join(this.projectRoot, '.continue', 'hooks'),
      globalHooksDir: join(homedir(), '.continue', 'hooks'),
      subagentsDir: join(this.projectRoot, '.continue', 'agents'),
      globalSubagentsDir: join(homedir(), '.continue', 'agents'),
      mcpConfigFile: join(this.projectRoot, '.continue', 'mcp.json'),
      globalMcpConfigFile: join(homedir(), '.continue', 'mcp.json'),
      detectInstalled: async () => {
        return (
          existsSync(join(this.projectRoot, '.continue')) ||
          existsSync(join(homedir(), '.continue'))
        );
      },
    });
  }

  /**
   * Register a new agent configuration
   */
  register(config: AgentConfig): void {
    this.agents.set(config.name, config);
  }

  /**
   * Get agent configuration by name
   */
  get(name: AgentType): AgentConfig | undefined {
    return this.agents.get(name);
  }

  /**
   * Get all registered agents
   */
  getAll(): AgentConfig[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get all registered agent names
   */
  getAllNames(): AgentType[] {
    return Array.from(this.agents.keys());
  }

  /**
   * Check if an agent is registered
   */
  has(name: AgentType): boolean {
    return this.agents.has(name);
  }

  /**
   * Detect installed agents in the project and globally
   */
  async detectInstalled(): Promise<AgentType[]> {
    const installed: AgentType[] = [];

    for (const [name, config] of this.agents) {
      try {
        const isInstalled = await config.detectInstalled();
        if (isInstalled) {
          installed.push(name);
        }
      } catch (_error) {
        // Ignore detection errors
        continue;
      }
    }

    return installed;
  }

  /**
   * Get the skills directory for an agent
   */
  getSkillsDir(agent: AgentType, global: boolean = false): string | undefined {
    const config = this.get(agent);
    if (!config) return undefined;
    return global ? config.globalSkillsDir : config.skillsDir;
  }

  /**
   * Get the rules directory for an agent
   */
  getRulesDir(agent: AgentType, global: boolean = false): string | undefined {
    const config = this.get(agent);
    if (!config) return undefined;
    return global ? config.globalRulesDir : config.rulesDir;
  }

  /**
   * Get the hooks directory for an agent
   */
  getHooksDir(agent: AgentType, global: boolean = false): string | undefined {
    const config = this.get(agent);
    if (!config) return undefined;
    return global ? config.globalHooksDir : config.hooksDir;
  }

  /**
   * Get the subagents directory for an agent
   */
  getSubagentsDir(agent: AgentType, global: boolean = false): string | undefined {
    const config = this.get(agent);
    if (!config) return undefined;
    return global ? config.globalSubagentsDir : config.subagentsDir;
  }

  /**
   * Get the MCP config file for an agent
   */
  getMcpConfigFile(agent: AgentType, global: boolean = false): string | undefined {
    const config = this.get(agent);
    if (!config) return undefined;
    return global ? config.globalMcpConfigFile : config.mcpConfigFile;
  }

  /**
   * Get resource directory for a specific resource type
   */
  getResourceDir(
    agent: AgentType,
    resourceType: string,
    global: boolean = false,
  ): string | undefined {
    switch (resourceType) {
      case 'skills':
        return this.getSkillsDir(agent, global);
      case 'rules':
        return this.getRulesDir(agent, global);
      case 'hooks':
        return this.getHooksDir(agent, global);
      case 'subagents':
        return this.getSubagentsDir(agent, global);
      case 'mcp':
        return this.getMcpConfigFile(agent, global);
      default:
        return undefined;
    }
  }
}
