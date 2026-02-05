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
import {
  SUBAGENT_FILE_NAMES,
  EXCLUDE_PATTERNS,
  sanitizeFileName,
} from '@coding-agent-fabric/common';
import { ResourceHandler } from '@coding-agent-fabric/plugin-api';
import { AgentRegistry } from './agent-registry.js';

export interface SubagentsHandlerOptions {
  agentRegistry: AgentRegistry;
  projectRoot: string;
  globalRoot?: string;
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
  private projectRoot: string;
  private globalRoot?: string;

  constructor(options: SubagentsHandlerOptions) {
    this.agentRegistry = options.agentRegistry;
    this.projectRoot = options.projectRoot;
    this.globalRoot = options.globalRoot;
  }

  /**
   * Discover subagents from a source
   */
  async discover(source: ParsedSource, options?: DiscoverOptions): Promise<Resource[]> {
    const localPath = source.localPath;

    if (!localPath) {
      throw new Error(
        'Local path is required for discovery. Please ensure the resource is installed.',
      );
    }

    return this.discoverFromPath(localPath, options);
  }

  /**
   * Discover subagents from a local directory path
   */
  async discoverFromPath(localPath: string, _options?: DiscoverOptions): Promise<Resource[]> {
    const resources: Resource[] = [];

    // Find all subagent config files
    const configFiles = await this.findSubagentFiles(localPath);

    for (const configPath of configFiles) {
      const configDir = dirname(configPath);
      const ext = extname(configPath);
      const format =
        ext === '.json'
          ? 'coding-agent-fabric-json'
          : ext === '.md'
            ? 'markdown-frontmatter'
            : 'claude-code-yaml';

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
      console.log('Installed subagent %s to %s', resource.name, targetPath);
    }
  }

  /**
   * Remove a subagent from target agents
   */
  async remove(
    resource: Resource,
    targets: InstallTarget[],
    options: RemoveOptions,
  ): Promise<void> {
    for (const target of targets) {
      const installPath = this.getInstallPath(target.agent, target.scope);
      const targetFormat = this.getTargetFormat(target.agent);
      const targetFileName = this.getTargetFileName(resource.name, targetFormat);
      const targetPath = join(installPath, targetFileName);

      // Also check for other common extensions to be safe
      const baseName = sanitizeFileName(resource.name);
      const possiblePaths = [
        targetPath,
        join(installPath, `${baseName}.json`),
        join(installPath, `${baseName}.yaml`),
        join(installPath, `${baseName}.yml`),
      ];

      let removed = false;
      for (const p of possiblePaths) {
        if (existsSync(p)) {
          await unlink(p);
          console.log('Removed subagent %s from %s', resource.name, p);
          removed = true;
        }
      }

      if (!removed) {
        console.warn('Subagent %s not found at %s', resource.name, targetPath);
      }
    }
  }

  /**
   * List installed subagents by scanning agent directories
   */
  async list(scope: 'global' | 'project' | 'both'): Promise<InstalledResource[]> {
    const resourcesMap: Map<string, InstalledResource> = new Map();
    const agents = this.getSupportedAgents();
    const scopes: Scope[] = scope === 'both' ? ['project', 'global'] : [scope];

    const scannedPaths = new Set<string>();

    for (const agent of agents) {
      for (const s of scopes) {
        try {
          const installPath = this.getInstallPath(agent, s);
          if (!existsSync(installPath) || scannedPaths.has(installPath)) continue;
          scannedPaths.add(installPath);

          const entries = await readdir(installPath, { withFileTypes: true });
          for (const entry of entries) {
            // Subagents are usually single files (json or yaml)
            if (entry.isFile()) {
              const configPath = join(installPath, entry.name);
              const ext = extname(configPath);
              if (
                SUBAGENT_FILE_NAMES.includes(entry.name) ||
                ['.json', '.yaml', '.yml'].includes(ext)
              ) {
                const format = ext === '.json' ? 'coding-agent-fabric-json' : 'claude-code-yaml';

                try {
                  const config = await this.parseSubagentConfig(configPath, format);
                  const resourceName = config.name;
                  let resource = resourcesMap.get(resourceName);

                  if (!resource) {
                    resource = {
                      type: this.type,
                      name: resourceName,
                      version: config.version,
                      description: config.description || '',
                      metadata: {
                        model: config.model,
                        format,
                      },
                      files: [],
                      source: '', // Hard to infer for single files unless we track it
                      sourceType: 'local',
                      sourceUrl: '',
                      installedAt: '',
                      updatedAt: '',
                      installedFor: [],
                    };
                    resourcesMap.set(resourceName, resource);
                  }

                  const existingInstall = resource.installedFor.find(
                    (i) => i.agent === agent && i.scope === s && i.path === configPath,
                  );
                  if (!existingInstall) {
                    resource.installedFor.push({
                      agent,
                      scope: s,
                      path: configPath,
                    });
                  }
                } catch (_e) {
                  // Skip invalid configs
                  continue;
                }
              }
            }
          }
        } catch (error) {
          console.error('Failed to list subagents for agent %s in scope %s:', agent, s, error);
        }
      }
    }

    return Array.from(resourcesMap.values());
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
      } else if (entry.isFile()) {
        const isSubagentFile =
          SUBAGENT_FILE_NAMES.includes(entry.name) ||
          (entry.name.endsWith('.md') && (dir.endsWith('agents') || dir.endsWith('subagents')));
        if (isSubagentFile) {
          configFiles.push(fullPath);
        }
      }
    }

    return configFiles;
  }

  /**
   * Parse subagent config from file
   */
  private async parseSubagentConfig(
    filePath: string,
    format: 'coding-agent-fabric-json' | 'claude-code-yaml' | 'markdown-frontmatter',
  ): Promise<SubagentConfig> {
    const content = await readFile(filePath, 'utf-8');

    if (format === 'coding-agent-fabric-json') {
      const config = JSON.parse(content) as SubagentConfig;
      return config;
    } else if (format === 'markdown-frontmatter') {
      // Parse markdown with frontmatter
      const metadata: { name?: string; version?: string; description?: string; model?: string } =
        {};

      // Extract front matter if present
      const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      let instructions = content;

      if (frontMatterMatch) {
        const frontMatter = frontMatterMatch[1];
        const nameMatch = frontMatter.match(/^name:\s*(.+)$/m);
        const versionMatch = frontMatter.match(/^version:\s*(.+)$/m);
        const descMatch = frontMatter.match(/^description:\s*(.+)$/m);
        const modelMatch = frontMatter.match(/^model:\s*(.+)$/m);

        if (nameMatch) metadata.name = nameMatch[1].trim();
        if (versionMatch) metadata.version = versionMatch[1].trim();
        if (descMatch) metadata.description = descMatch[1].trim();
        if (modelMatch) metadata.model = modelMatch[1].trim();

        instructions = content.replace(frontMatterMatch[0], '').trim();
      }

      // Fallback for name from first heading
      if (!metadata.name) {
        const headingMatch = content.match(/^#\s+(.+)$/m);
        if (headingMatch) {
          metadata.name = headingMatch[1].trim();
        } else {
          metadata.name = basename(filePath, '.md');
        }
      }

      return {
        name: metadata.name,
        version: metadata.version,
        description: metadata.description || '',
        model: metadata.model,
        instructions,
      };
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
   * Simple YAML parser (for basic key-value pairs and multi-line strings)
   * In production, use a proper YAML library like js-yaml
   */
  private parseSimpleYaml(content: string): ClaudeCodeYamlConfig {
    const config: ClaudeCodeYamlConfig = {};
    const lines = content.split('\n');
    let currentKey: string | null = null;
    let inMultiLine = false;
    let multiLineContent: string[] = [];

    for (const line of lines) {
      if (inMultiLine && currentKey) {
        // Multi-line content is indented (using 2 spaces as convention)
        if (line.trim() === '' || line.startsWith('  ')) {
          multiLineContent.push(line.startsWith('  ') ? line.substring(2) : line);
          continue;
        } else {
          config[currentKey] = multiLineContent.join('\n').trim();
          inMultiLine = false;
          multiLineContent = [];
          currentKey = null;
        }
      }

      // Strip comments before matching
      const lineWithoutComment = line.split('#')[0];
      const match = lineWithoutComment.match(/^(\w+):\s*(.*)$/);
      if (match) {
        const [, key, value] = match;
        const trimmedValue = value.trim();
        if (trimmedValue === '|' || trimmedValue === '>') {
          currentKey = key;
          inMultiLine = true;
          multiLineContent = [];
        } else {
          config[key] = trimmedValue.replace(/^['"]|['"]$/g, '');
        }
      }
    }

    if (inMultiLine && currentKey) {
      config[currentKey] = multiLineContent.join('\n').trim();
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
    const safeName = sanitizeFileName(name);
    if (format === 'claude-code-yaml') {
      return `${safeName}.yaml`;
    }
    return `${safeName}.json`;
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
    const configFile = resource.files.find((f) => {
      const bname = basename(f.path);
      return (
        SUBAGENT_FILE_NAMES.some((name) => bname.includes(name.split('.')[0])) ||
        (bname.endsWith('.md') && sourceFormat === 'markdown-frontmatter')
      );
    });

    if (!configFile || !configFile.content) {
      throw new Error('No config file found in resource');
    }

    // Parse source config
    let config: SubagentConfig;
    if (sourceFormat === 'coding-agent-fabric-json') {
      config = JSON.parse(configFile.content);
    } else if (sourceFormat === 'markdown-frontmatter') {
      // Reuse parseSubagentConfig logic or similar
      const metadata: { name?: string; version?: string; description?: string; model?: string } =
        {};
      const content = configFile.content;
      const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      let instructions = content;

      if (frontMatterMatch) {
        const frontMatter = frontMatterMatch[1];
        const nameMatch = frontMatter.match(/^name:\s*(.+)$/m);
        const versionMatch = frontMatter.match(/^version:\s*(.+)$/m);
        const descMatch = frontMatter.match(/^description:\s*(.+)$/m);
        const modelMatch = frontMatter.match(/^model:\s*(.+)$/m);

        if (nameMatch) metadata.name = nameMatch[1].trim();
        if (versionMatch) metadata.version = versionMatch[1].trim();
        if (descMatch) metadata.description = descMatch[1].trim();
        if (modelMatch) metadata.model = modelMatch[1].trim();

        instructions = content.replace(frontMatterMatch[0], '').trim();
      }

      config = {
        name: metadata.name || resource.name,
        description: metadata.description || resource.description,
        model: metadata.model,
        instructions,
      };
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
