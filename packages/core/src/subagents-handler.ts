/**
 * SubagentsHandler - Manages subagent resources
 */

import { readFile, writeFile, mkdir, readdir, stat, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, basename, dirname, extname } from 'node:path';
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
  ResourceFile,
} from '@coding-agent-fabric/common';
import { SUBAGENT_FILE_NAMES, EXCLUDE_PATTERNS } from '@coding-agent-fabric/common';
import { ResourceHandler } from '@coding-agent-fabric/plugin-api';
import { AgentRegistry } from './agent-registry.js';
import { LockManager } from './lock-manager.js';
import { SourceParser } from './source-parser.js';

export interface SubagentsHandlerOptions {
  agentRegistry: AgentRegistry;
  lockManager: LockManager;
  projectRoot: string;
  globalRoot?: string;
  sourceParser?: SourceParser;
}

/**
 * Subagent configuration (coding-agent-fabric JSON format)
 */
interface SubagentConfig {
  name: string;
  version?: string;
  description: string;
  model?: string;
  instructions?: string;
  tools?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Claude Code YAML format (simplified)
 */
interface ClaudeCodeYamlConfig {
  name?: string;
  description?: string;
  model?: string;
  instructions?: string;
  [key: string]: unknown;
}

/**
 * SubagentsHandler manages subagent resources
 */
export class SubagentsHandler implements ResourceHandler {
  readonly type = 'subagents';
  readonly displayName = 'Subagents';
  readonly description = 'AI subagent configurations';
  readonly isCore = true;

  private agentRegistry: AgentRegistry;
  private lockManager: LockManager;
  private projectRoot: string;
  private globalRoot?: string;
  private sourceParser: SourceParser;

  constructor(options: SubagentsHandlerOptions) {
    this.agentRegistry = options.agentRegistry;
    this.lockManager = options.lockManager;
    this.projectRoot = options.projectRoot;
    this.globalRoot = options.globalRoot;
    this.sourceParser = options.sourceParser || new SourceParser();
  }

  /**
   * Discover subagents from a source
   */
  async discover(source: ParsedSource, _options?: DiscoverOptions): Promise<Resource[]> {
    let localPath = source.localPath;

    // If not a local source, download it first
    if (source.type !== 'local' || !localPath) {
      const result = await this.sourceParser.parse(source.url);
      localPath = result.localDir;
    }

    const resources: Resource[] = [];

    // Find all subagent config files
    const configFiles = await this.findSubagentFiles(localPath);

    for (const configPath of configFiles) {
      const configDir = dirname(configPath);
      const ext = extname(configPath);
      const format = ext === '.json' ? 'coding-agent-fabric-json' : 'claude-code-yaml';

      // Parse subagent config
      const config = await this.parseSubagentConfig(configPath, format);

      // Collect all files in the subagent directory
      const files = await this.collectSubagentFiles(configDir);

      resources.push({
        type: this.type,
        name: config.name,
        version: config.version,
        description: config.description || '',
        metadata: {
          model: config.model,
          format,
          configHash: this.generateConfigHash(config),
        },
        files,
      });
    }

    return resources;
  }

  /**
   * Install a subagent to target agents
   */
  async install(
    resource: Resource,
    targets: InstallTarget[],
    options: InstallOptions,
  ): Promise<void> {
    // Validate resource
    if (!options.skipValidation) {
      const validation = await this.validate(resource);
      if (!validation.valid) {
        throw new Error(`Subagent validation failed: ${validation.errors.join(', ')}`);
      }
    }

    // Install to each target
    for (const target of targets) {
      const installPath = this.getInstallPath(target.agent, target.scope);

      // Ensure install directory exists
      await mkdir(installPath, { recursive: true });

      // Determine target format based on agent
      const targetFormat = this.getTargetFormat(target.agent);
      const targetFileName = this.getTargetFileName(resource.name, targetFormat);
      const targetPath = join(installPath, targetFileName);

      // Check if already exists
      if (existsSync(targetPath) && !options.force) {
        throw new Error(`Subagent ${resource.name} already exists at ${targetPath}`);
      }

      // Convert and write config
      const sourceFormat = (resource.metadata.format as string) || 'coding-agent-fabric-json';
      const configContent = await this.convertFormat(resource, sourceFormat, targetFormat);

      await writeFile(targetPath, configContent, 'utf-8');
      console.log(`Installed subagent ${resource.name} to ${targetPath}`);
    }
  }

  /**
   * Remove a subagent from target agents
   */
  async remove(
    resource: Resource,
    targets: InstallTarget[],
    _options: RemoveOptions,
  ): Promise<void> {
    for (const target of targets) {
      const installPath = this.getInstallPath(target.agent, target.scope);

      const targetFormat = this.getTargetFormat(target.agent);
      const targetFileName = this.getTargetFileName(resource.name, targetFormat);
      const targetPath = join(installPath, targetFileName);

      if (!existsSync(targetPath)) {
        console.warn(`Subagent ${resource.name} not found at ${targetPath}`);
        continue;
      }

      // Remove the subagent file
      await unlink(targetPath);
      console.log(`Removed subagent ${resource.name} from ${targetPath}`);
    }
  }

  /**
   * List installed subagents
   */
  async list(scope: 'global' | 'project' | 'both'): Promise<InstalledResource[]> {
    const lockFile = await this.lockManager.load();
    const resources: InstalledResource[] = [];

    // Filter resources by type and scope
    for (const entry of Object.values(lockFile.resources)) {
      if (entry.type !== 'subagents') continue;

      // Check scope
      const matchesScope =
        scope === 'both' || entry.installedFor.some((install) => install.scope === scope);

      if (matchesScope) {
        resources.push({
          type: entry.type,
          name: entry.name,
          version: entry.version,
          description: '', // TODO: Load from installed file
          metadata: {},
          files: [], // TODO: Load from installed file
          source: entry.source,
          sourceType: entry.sourceType,
          sourceUrl: entry.sourceUrl,
          installedAt: entry.installedAt,
          updatedAt: entry.updatedAt,
          installedFor: entry.installedFor,
        });
      }
    }

    return resources;
  }

  /**
   * Validate a subagent resource
   */
  async validate(resource: Resource): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!resource.name) {
      errors.push('Subagent name is required');
    }

    if (!resource.description) {
      warnings.push('Subagent description is missing');
    }

    // Check files
    if (!resource.files || resource.files.length === 0) {
      errors.push('Subagent must have at least one file');
    }

    // Check metadata
    if (!resource.metadata.format) {
      warnings.push('Subagent format not specified');
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
    return this.agentRegistry.getAllNames().filter((agent: AgentType) => {
      const config = this.agentRegistry.get(agent);
      return config?.subagentsDir !== undefined;
    });
  }

  /**
   * Get installation path for an agent
   */
  getInstallPath(agent: AgentType, scope: Scope): string {
    const config = this.agentRegistry.get(agent);
    if (!config) {
      throw new Error(`Agent ${agent} not found`);
    }

    if (!config.subagentsDir) {
      throw new Error(`Agent ${agent} does not support subagents`);
    }

    if (scope === 'global' && config.globalSubagentsDir) {
      return config.globalSubagentsDir;
    } else if (scope === 'project') {
      return config.subagentsDir;
    } else {
      throw new Error(`Invalid scope: ${scope}`);
    }
  }

  /**
   * Recursively find all subagent config files
   */
  private async findSubagentFiles(dir: string): Promise<string[]> {
    const configFiles: string[] = [];

    if (!existsSync(dir)) {
      return configFiles;
    }

    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      // Skip excluded patterns
      if (EXCLUDE_PATTERNS.some((pattern) => entry.name.includes(pattern))) {
        continue;
      }

      if (entry.isDirectory()) {
        // Recurse into subdirectory
        const subFiles = await this.findSubagentFiles(fullPath);
        configFiles.push(...subFiles);
      } else if (entry.isFile() && SUBAGENT_FILE_NAMES.includes(entry.name)) {
        configFiles.push(fullPath);
      }
    }

    return configFiles;
  }

  /**
   * Parse subagent config from file
   */
  private async parseSubagentConfig(
    filePath: string,
    format: 'coding-agent-fabric-json' | 'claude-code-yaml',
  ): Promise<SubagentConfig> {
    const content = await readFile(filePath, 'utf-8');

    if (format === 'coding-agent-fabric-json') {
      const config = JSON.parse(content) as SubagentConfig;
      return config;
    } else {
      // Parse YAML (simple implementation - in production use a YAML library)
      const config = this.parseSimpleYaml(content);
      return {
        name: config.name || basename(dirname(filePath)),
        description: config.description || '',
        model: config.model,
        instructions: config.instructions,
      };
    }
  }

  /**
   * Simple YAML parser (for basic key-value pairs)
   * In production, use a proper YAML library like js-yaml
   */
  private parseSimpleYaml(content: string): ClaudeCodeYamlConfig {
    const config: ClaudeCodeYamlConfig = {};
    const lines = content.split('\n');

    for (const line of lines) {
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        const [, key, value] = match;
        config[key] = value.trim();
      }
    }

    return config;
  }

  /**
   * Collect all files in a subagent directory
   */
  private async collectSubagentFiles(dir: string): Promise<ResourceFile[]> {
    const files: ResourceFile[] = [];

    if (!existsSync(dir)) {
      return files;
    }

    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      // Skip excluded patterns
      if (EXCLUDE_PATTERNS.some((pattern) => entry.name.includes(pattern))) {
        continue;
      }

      if (entry.isFile()) {
        const content = await readFile(fullPath, 'utf-8');
        const stats = await stat(fullPath);

        files.push({
          path: fullPath,
          content,
          mode: stats.mode,
        });
      }
    }

    return files;
  }

  /**
   * Generate config hash for update detection
   */
  private generateConfigHash(config: SubagentConfig): string {
    // Simple hash implementation - in production use a crypto library
    const str = JSON.stringify(config);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Get target format for an agent
   */
  private getTargetFormat(agent: AgentType): 'coding-agent-fabric-json' | 'claude-code-yaml' {
    // Claude Code uses YAML, others use JSON
    if (agent === 'claude-code') {
      return 'claude-code-yaml';
    }
    return 'coding-agent-fabric-json';
  }

  /**
   * Get target file name for a subagent
   */
  private getTargetFileName(
    name: string,
    format: 'coding-agent-fabric-json' | 'claude-code-yaml',
  ): string {
    if (format === 'claude-code-yaml') {
      return `${name}.yaml`;
    }
    return `${name}.json`;
  }

  /**
   * Convert subagent config between formats
   */
  private async convertFormat(
    resource: Resource,
    sourceFormat: string,
    targetFormat: 'coding-agent-fabric-json' | 'claude-code-yaml',
  ): Promise<string> {
    // Extract config from resource files
    const configFile = resource.files.find((f) =>
      SUBAGENT_FILE_NAMES.some((name) => basename(f.path).includes(name.split('.')[0])),
    );

    if (!configFile || !configFile.content) {
      throw new Error('No config file found in resource');
    }

    // Parse source config
    let config: SubagentConfig;
    if (sourceFormat === 'coding-agent-fabric-json') {
      config = JSON.parse(configFile.content);
    } else {
      const yamlConfig = this.parseSimpleYaml(configFile.content);
      config = {
        name: resource.name,
        description: resource.description,
        model: yamlConfig.model,
        instructions: yamlConfig.instructions,
      };
    }

    // Convert to target format
    if (targetFormat === 'coding-agent-fabric-json') {
      return JSON.stringify(config, null, 2);
    } else {
      // Convert to YAML (simple implementation)
      const yaml = [
        `name: ${config.name}`,
        config.description ? `description: ${config.description}` : '',
        config.model ? `model: ${config.model}` : '',
        config.instructions
          ? `instructions: |\n  ${config.instructions.split('\n').join('\n  ')}`
          : '',
      ]
        .filter(Boolean)
        .join('\n');

      return yaml;
    }
  }
}
