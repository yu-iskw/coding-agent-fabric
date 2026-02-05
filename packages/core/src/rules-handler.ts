/**
 * RulesHandler - Manages rules resources
 */

import { readFile, writeFile, mkdir, readdir, symlink, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, basename, dirname, relative, sep, extname } from 'node:path';
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
  NamingStrategy,
  ListResult,
  ListError,
} from '@coding-agent-fabric/common';
import {
  EXCLUDE_PATTERNS,
  RULE_FILE_EXTENSIONS,
  generateSmartName,
  sanitizeFileName,
} from '@coding-agent-fabric/common';
import { ResourceHandler } from '@coding-agent-fabric/plugin-api';
import { AgentRegistry } from './agent-registry.js';
import { auditLogger, AuditLogger } from './audit-logger.js';

export interface RulesHandlerOptions {
  agentRegistry: AgentRegistry;
  projectRoot: string;
  globalRoot?: string;
  auditLogger?: AuditLogger;
}

/**
 * RulesHandler manages rules resources
 */
export class RulesHandler implements ResourceHandler {
  readonly type = 'rules';
  readonly displayName = 'Rules';
  readonly description = 'Proactive, context-aware instructions for agents';
  readonly isCore = true;

  private agentRegistry: AgentRegistry;
  private projectRoot: string;
  private globalRoot?: string;
  private auditLogger: AuditLogger;

  constructor(options: RulesHandlerOptions) {
    this.agentRegistry = options.agentRegistry;
    this.projectRoot = options.projectRoot;
    this.globalRoot = options.globalRoot;
    this.auditLogger = options.auditLogger || auditLogger;

    // Configure audit logger with roots for path sanitization
    if (this.projectRoot) this.auditLogger.setProjectRoot(this.projectRoot);
    if (this.globalRoot) this.auditLogger.setGlobalRoot(this.globalRoot);
  }

  /**
   * Discover rules from a source
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
   * Discover rules from a local directory path
   */
  async discoverFromPath(localPath: string, options?: DiscoverOptions): Promise<Resource[]> {
    const resources: Resource[] = [];

    // Recursively find all rule files (*.md, *.mdc)
    const ruleFiles = await this.findRuleFiles(localPath);

    for (const rulePath of ruleFiles) {
      const ruleDir = dirname(rulePath);
      const ruleContent = await readFile(rulePath, 'utf-8');

      // Extract metadata from rule file
      const metadata = this.parseRuleMetadata(ruleContent, rulePath);
      const originalName = metadata.name || basename(rulePath, extname(rulePath));

      // Extract categories from path
      const relativePath = relative(localPath, ruleDir);
      const pathParts = relativePath.split(sep).filter(Boolean);
      // If the file is in a 'rules' directory, don't include that in categories
      const agentNames = this.agentRegistry.getAllNames().map((name) => `.${name}`);
      const categoryParts = pathParts.filter((p) => p !== 'rules' && !agentNames.includes(p));
      const categories = options?.categories || categoryParts;

      // Generate smart name based on strategy
      const namingStrategy = options?.namingStrategy || 'smart-disambiguation';
      const installedName = this.generateInstalledName(originalName, categories, namingStrategy);

      resources.push({
        type: this.type,
        name: installedName,
        version: metadata.version,
        description: metadata.description || '',
        metadata: {
          originalName,
          categories,
          namingStrategy,
          globs: metadata.globs,
          sourcePath: relative(localPath, rulePath),
          configHash: this.generateConfigHash(metadata, ruleContent),
        },
        files: [
          {
            path: basename(rulePath),
            content: ruleContent,
          },
        ],
      });
    }

    return resources;
  }

  /**
   * Install a rule to target agents
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
        throw new Error(`Rule validation failed: ${validation.errors.join(', ')}`);
      }
    }

    // Install to each target
    for (const target of targets) {
      const installPath = this.getInstallPath(target.agent, target.scope);

      // Ensure install directory exists
      await mkdir(installPath, { recursive: true });

      // Determine extension based on agent
      const extension = target.agent === 'cursor' ? '.mdc' : '.md';
      const targetFileName = `${sanitizeFileName(resource.name)}${extension}`;
      const targetPath = join(installPath, targetFileName);

      // Check if already exists
      if (existsSync(targetPath) && !options.force) {
        throw new Error(`Rule ${resource.name} already exists at ${targetPath}`);
      }

      // Install file
      if (target.mode === 'symlink') {
        // We can only symlink if the source is on disk
        // Since rules are usually single files, we symlink the file itself
        // Note: symlinking single files might be tricky if the agent expects specific extensions.
        // For rules, it's better to copy or handle the extension in the symlink name.

        // Find the absolute source path if available in metadata
        const sourcePath = resource.metadata?.sourceDir
          ? join(resource.metadata.sourceDir as string, resource.files[0].path)
          : undefined;

        if (sourcePath && existsSync(sourcePath)) {
          await symlink(sourcePath, targetPath);
        } else {
          // Fallback to copy if no absolute path is available
          await writeFile(targetPath, resource.files[0].content || '', 'utf-8');
        }
      } else {
        // Copy content
        await writeFile(targetPath, resource.files[0].content || '', 'utf-8');
      }

      this.auditLogger.success('install-rule', resource.name, this.type, targetPath, {
        agent: target.agent,
        scope: target.scope,
        mode: target.mode,
      });
    }
  }

  /**
   * Remove a rule from target agents
   */
  async remove(
    resource: Resource,
    targets: InstallTarget[],
    _options: RemoveOptions,
  ): Promise<void> {
    for (const target of targets) {
      const installPath = this.getInstallPath(target.agent, target.scope);
      const baseName = sanitizeFileName(resource.name);

      // Check for both .md and .mdc
      const possiblePaths = [
        join(installPath, `${baseName}.md`),
        join(installPath, `${baseName}.mdc`),
      ];

      let removed = false;
      for (const targetPath of possiblePaths) {
        if (existsSync(targetPath)) {
          await rm(targetPath, { force: true });
          this.auditLogger.success('remove-rule', resource.name, this.type, targetPath, {
            agent: target.agent,
            scope: target.scope,
          });
          removed = true;
        }
      }

      if (!removed) {
        this.auditLogger.warning('remove-rule-not-found', resource.name, this.type, {
          agent: target.agent,
          scope: target.scope,
        });
      }
    }
  }

  /**
   * List installed rules by scanning agent directories
   */
  async list(scope: 'global' | 'project' | 'both'): Promise<ListResult> {
    const resourcesMap: Map<string, InstalledResource> = new Map();
    const errors: ListError[] = [];
    const agents = this.getSupportedAgents();
    const scopes: Scope[] = scope === 'both' ? ['project', 'global'] : [scope];

    const scannedPaths = new Set<string>();

    for (const agent of agents) {
      for (const s of scopes) {
        let installPath = '';
        try {
          installPath = this.getInstallPath(agent, s);
          if (!existsSync(installPath) || scannedPaths.has(installPath)) continue;
          scannedPaths.add(installPath);

          const entries = await readdir(installPath, { withFileTypes: true });
          for (const entry of entries) {
            if (entry.isFile() || entry.isSymbolicLink()) {
              const ext = extname(entry.name);
              if (RULE_FILE_EXTENSIONS.includes(ext as (typeof RULE_FILE_EXTENSIONS)[number])) {
                const rulePath = join(installPath, entry.name);
                const content = await readFile(rulePath, 'utf-8');
                const metadata = this.parseRuleMetadata(content, rulePath);

                const filenameBasedName = basename(entry.name, ext);
                const resourceKey = metadata.name || filenameBasedName;
                let resource = resourcesMap.get(resourceKey);

                if (!resource) {
                  resource = {
                    type: this.type,
                    name: resourceKey,
                    version: metadata.version,
                    description: metadata.description || '',
                    metadata: {
                      originalName: metadata.name || filenameBasedName,
                      globs: metadata.globs,
                    },
                    files: [],
                    source: '',
                    sourceType: 'local',
                    sourceUrl: '',
                    installedAt: '',
                    updatedAt: '',
                    installedFor: [],
                  };
                  resourcesMap.set(resourceKey, resource);
                }

                const existingInstall = resource.installedFor.find(
                  (i) => i.agent === agent && i.scope === s && i.path === rulePath,
                );
                if (!existingInstall) {
                  resource.installedFor.push({
                    agent,
                    scope: s,
                    path: rulePath,
                  });
                }
              }
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.auditLogger.failure('list', 'rules', this.type, errorMessage, installPath);
          errors.push({
            agent,
            scope: s,
            error: `Failed to access ${this.auditLogger.sanitizePath(installPath)}: ${errorMessage}`,
          });
        }
      }
    }

    return {
      resources: Array.from(resourcesMap.values()),
      errors,
    };
  }

  /**
   * Validate a rule resource
   */
  async validate(resource: Resource): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!resource.name) {
      errors.push('Rule name is required');
    }

    if (!resource.files || resource.files.length === 0) {
      errors.push('Rule must have a file');
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
      return config?.rulesDir !== undefined;
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

    if (!config.rulesDir) {
      throw new Error(`Agent ${agent} does not support rules`);
    }

    if (scope === 'global' && config.globalRulesDir) {
      return config.globalRulesDir;
    } else if (scope === 'project') {
      return config.rulesDir;
    } else {
      throw new Error(`Invalid scope: ${scope}`);
    }
  }

  /**
   * Recursively find all rule files
   */
  private async findRuleFiles(dir: string): Promise<string[]> {
    const ruleFiles: string[] = [];

    if (!existsSync(dir)) {
      return ruleFiles;
    }

    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (EXCLUDE_PATTERNS.some((pattern) => entry.name.includes(pattern))) {
        continue;
      }

      if (entry.isDirectory()) {
        const subFiles = await this.findRuleFiles(fullPath);
        ruleFiles.push(...subFiles);
      } else if (entry.isFile()) {
        const ext = extname(entry.name);
        if (RULE_FILE_EXTENSIONS.includes(ext as (typeof RULE_FILE_EXTENSIONS)[number])) {
          // Avoid picking up SKILL.md as a rule
          if (entry.name !== 'SKILL.md') {
            ruleFiles.push(fullPath);
          }
        }
      }
    }

    return ruleFiles;
  }

  /**
   * Parse metadata from rule content
   */
  private parseRuleMetadata(
    content: string,
    _filePath: string,
  ): {
    name?: string;
    version?: string;
    description?: string;
    globs?: string[];
  } {
    const metadata: { name?: string; version?: string; description?: string; globs?: string[] } =
      {};

    // Extract front matter if present
    const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (frontMatterMatch) {
      const frontMatter = frontMatterMatch[1];
      const nameMatch = frontMatter.match(/^name:\s*(.+)$/m);
      const versionMatch = frontMatter.match(/^version:\s*(.+)$/m);
      const descMatch = frontMatter.match(/^description:\s*(.+)$/m);
      const globsMatch = frontMatter.match(/^globs:\s*(.+)$/m);

      if (nameMatch) metadata.name = nameMatch[1].trim();
      if (versionMatch) metadata.version = versionMatch[1].trim();
      if (descMatch) metadata.description = descMatch[1].trim();

      if (globsMatch) {
        try {
          const globsStr = globsMatch[1].trim();
          if (globsStr.startsWith('[') && globsStr.endsWith(']')) {
            metadata.globs = JSON.parse(globsStr.replace(/'/g, '"'));
          } else {
            metadata.globs = [globsStr.replace(/^['"]|['"]$/g, '')];
          }
        } catch (_e) {
          metadata.globs = [globsMatch[1].trim()];
        }
      }
    }

    if (!metadata.name) {
      const headingMatch = content.match(/^#\s+(.+)$/m);
      if (headingMatch) {
        metadata.name = headingMatch[1].trim();
      }
    }

    return metadata;
  }

  /**
   * Generate config hash for update detection
   */
  private generateConfigHash(
    metadata: { name?: string; version?: string; description?: string; globs?: string[] },
    content: string,
  ): string {
    const str = JSON.stringify(metadata) + content;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Generate installed name based on naming strategy
   */
  private generateInstalledName(
    originalName: string,
    categories: string[],
    strategy: NamingStrategy,
  ): string {
    switch (strategy) {
      case 'smart-disambiguation':
        return generateSmartName(originalName, categories);

      case 'full-path-prefix':
        return categories.length > 0
          ? `${categories.join('-')}-${sanitizeFileName(originalName)}`
          : sanitizeFileName(originalName);

      case 'category-prefix':
        return categories.length > 0
          ? `${categories[categories.length - 1]}-${sanitizeFileName(originalName)}`
          : sanitizeFileName(originalName);

      case 'original-name':
      default:
        return sanitizeFileName(originalName);
    }
  }
}
