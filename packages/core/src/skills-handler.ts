/**
 * SkillsHandler - Manages skills resources
 */

import { readFile, writeFile, mkdir, readdir, stat, symlink, rm, readlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, basename, dirname, relative, sep } from 'node:path';
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
  NamingStrategy,
  SourceType,
  ListResult,
  ListError,
} from '@coding-agent-fabric/common';
import {
  SKILL_FILE_NAME,
  EXCLUDE_PATTERNS,
  generateSmartName,
  sanitizeFileName,
  safeJoin,
} from '@coding-agent-fabric/common';
import { ResourceHandler } from '@coding-agent-fabric/plugin-api';
import { AgentRegistry } from './agent-registry.js';
import { auditLogger, AuditLogger } from './audit-logger.js';

export interface SkillsHandlerOptions {
  agentRegistry: AgentRegistry;
  projectRoot: string;
  globalRoot?: string;
  auditLogger?: AuditLogger;
}

/**
 * SkillsHandler manages skills resources
 */
export class SkillsHandler implements ResourceHandler {
  readonly type = 'skills';
  readonly displayName = 'Skills';
  readonly description = 'AI agent skills and workflows';
  readonly isCore = true;

  private agentRegistry: AgentRegistry;
  private projectRoot: string;
  private globalRoot?: string;
  private auditLogger: AuditLogger;

  constructor(options: SkillsHandlerOptions) {
    this.agentRegistry = options.agentRegistry;
    this.projectRoot = options.projectRoot;
    this.globalRoot = options.globalRoot;
    this.auditLogger = options.auditLogger || auditLogger;

    // Configure audit logger with roots for path sanitization
    if (this.projectRoot) this.auditLogger.setProjectRoot(this.projectRoot);
    if (this.globalRoot) this.auditLogger.setGlobalRoot(this.globalRoot);
  }

  /**
   * Discover skills from a source
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
   * Discover skills from a local directory path
   */
  async discoverFromPath(localPath: string, options?: DiscoverOptions): Promise<Resource[]> {
    const resources: Resource[] = [];

    // Recursively find all SKILL.md files
    const skillFiles = await this.findSkillFiles(localPath);

    for (const skillPath of skillFiles) {
      const skillDir = dirname(skillPath);
      const skillContent = await readFile(skillPath, 'utf-8');

      // Extract metadata from SKILL.md
      const metadata = this.parseSkillMetadata(skillContent);
      const originalName = metadata.name || basename(skillDir);

      // Extract categories from path
      const relativePath = relative(localPath, skillDir);
      const pathParts = relativePath.split(sep).filter(Boolean);
      // Remove the last part (skill directory name) to get categories
      const categories =
        options?.categories || (pathParts.length > 1 ? pathParts.slice(0, -1) : []);

      // Generate smart name based on strategy
      const namingStrategy = options?.namingStrategy || 'smart-disambiguation';
      const installedName = this.generateInstalledName(originalName, categories, namingStrategy);

      // Collect all files in the skill directory
      const files = await this.collectSkillFiles(skillDir);

      resources.push({
        type: this.type,
        name: installedName,
        version: metadata.version,
        description: metadata.description || '',
        metadata: {
          originalName,
          categories,
          namingStrategy,
          sourcePath: relative(localPath, skillDir),
          sourceDir: skillDir,
        },
        files,
      });
    }

    return resources;
  }

  /**
   * Install a skill to target agents
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
        throw new Error(`Skill validation failed: ${validation.errors.join(', ')}`);
      }
    }

    // Install to each target
    for (const target of targets) {
      const installPath = this.getInstallPath(target.agent, target.scope);

      // Ensure install directory exists
      await mkdir(installPath, { recursive: true });

      const targetPath = join(installPath, sanitizeFileName(resource.name));

      // Check if already exists
      if (existsSync(targetPath) && !options.force) {
        throw new Error(`Skill ${resource.name} already exists at ${targetPath}`);
      }

      // Remove existing if force
      if (existsSync(targetPath) && options.force) {
        await rm(targetPath, { recursive: true, force: true });
      }

      // Install files
      if (target.mode === 'symlink') {
        // Symlink the original discovered skill directory.
        const sourceDir = resource.metadata?.sourceDir;
        if (typeof sourceDir !== 'string' || sourceDir.length === 0) {
          throw new Error(
            `Skill ${resource.name} cannot be symlinked because metadata.sourceDir is missing`,
          );
        }
        await symlink(sourceDir, targetPath, 'dir');
      } else {
        // Copy files
        await mkdir(targetPath, { recursive: true });
        for (const file of resource.files) {
          if (file.path && file.content !== undefined) {
            const destPath = safeJoin(targetPath, file.path);
            await mkdir(dirname(destPath), { recursive: true });
            await writeFile(destPath, file.content, {
              mode: file.mode,
            });
          }
        }
      }

      this.auditLogger.success('install-skill', resource.name, this.type, targetPath, {
        agent: target.agent,
        scope: target.scope,
        mode: target.mode,
      });
    }
  }

  /**
   * Remove a skill from target agents
   */
  async remove(
    resource: Resource,
    targets: InstallTarget[],
    _options: RemoveOptions,
  ): Promise<void> {
    for (const target of targets) {
      const installPath = this.getInstallPath(target.agent, target.scope);

      const targetPath = join(installPath, sanitizeFileName(resource.name));

      if (!existsSync(targetPath)) {
        this.auditLogger.warning('remove-skill-not-found', resource.name, this.type, {
          targetPath,
          agent: target.agent,
          scope: target.scope,
        });
        continue;
      }

      // Remove the skill directory
      await rm(targetPath, { recursive: true, force: true });
      this.auditLogger.success('remove-skill', resource.name, this.type, targetPath, {
        agent: target.agent,
        scope: target.scope,
      });
    }
  }

  /**
   * List installed skills by scanning agent directories
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
            if (entry.isDirectory() || entry.isSymbolicLink()) {
              const skillDir = join(installPath, entry.name);
              const skillFilePath = join(skillDir, SKILL_FILE_NAME);

              if (existsSync(skillFilePath)) {
                const content = await readFile(skillFilePath, 'utf-8');
                const metadata = this.parseSkillMetadata(content);

                const resourceName = entry.name;
                let resource = resourcesMap.get(resourceName);

                if (!resource) {
                  // Try to infer source if it's a symlink
                  let source = '';
                  let sourceType: SourceType = 'local';
                  if (entry.isSymbolicLink()) {
                    try {
                      const linkTarget = await readlink(skillDir);
                      if (linkTarget.includes('node_modules')) {
                        sourceType = 'npm';
                        // Extract package name from path
                        const parts = linkTarget.split(sep);
                        const nmIndex = parts.indexOf('node_modules');
                        if (nmIndex !== -1 && nmIndex + 1 < parts.length) {
                          source = parts[nmIndex + 1];
                          if (source.startsWith('@') && nmIndex + 2 < parts.length) {
                            source += '/' + parts[nmIndex + 2];
                          }
                        }
                      }
                    } catch (_e) {
                      /* ignore */
                    }
                  }

                  resource = {
                    type: this.type,
                    name: resourceName,
                    version: metadata.version,
                    description: metadata.description || '',
                    metadata: {
                      originalName: metadata.name || resourceName,
                    },
                    files: [],
                    source,
                    sourceType,
                    sourceUrl: '',
                    installedAt: '',
                    updatedAt: '',
                    installedFor: [],
                  };
                  resourcesMap.set(resourceName, resource);
                }

                const existingInstall = resource.installedFor.find(
                  (i) => i.agent === agent && i.scope === s && i.path === skillDir,
                );
                if (!existingInstall) {
                  resource.installedFor.push({
                    agent,
                    scope: s,
                    path: skillDir,
                  });
                }
              }
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.auditLogger.failure('list', 'skills', this.type, errorMessage, installPath);
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
   * Validate a skill resource
   */
  async validate(resource: Resource): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!resource.name) {
      errors.push('Skill name is required');
    }

    if (!resource.description) {
      warnings.push('Skill description is missing');
    }

    // Check files
    if (!resource.files || resource.files.length === 0) {
      errors.push('Skill must have at least one file');
    } else {
      // Check for SKILL.md
      const hasSkillFile = resource.files.some((f) => basename(f.path) === SKILL_FILE_NAME);
      if (!hasSkillFile) {
        warnings.push('Skill does not have a SKILL.md file');
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
    return this.agentRegistry.getAllNames();
  }

  /**
   * Get installation path for an agent
   */
  getInstallPath(agent: AgentType, scope: Scope): string {
    const config = this.agentRegistry.get(agent);
    if (!config) {
      throw new Error(`Agent ${agent} not found`);
    }

    if (scope === 'global' && config.globalSkillsDir) {
      return config.globalSkillsDir;
    } else if (scope === 'project') {
      return config.skillsDir;
    } else {
      throw new Error(`Invalid scope: ${scope}`);
    }
  }

  /**
   * Recursively find all SKILL.md files
   */
  private async findSkillFiles(dir: string): Promise<string[]> {
    const skillFiles: string[] = [];

    if (!existsSync(dir)) {
      return skillFiles;
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
        const subFiles = await this.findSkillFiles(fullPath);
        skillFiles.push(...subFiles);
      } else if (entry.isFile() && entry.name === SKILL_FILE_NAME) {
        skillFiles.push(fullPath);
      }
    }

    return skillFiles;
  }

  /**
   * Parse metadata from SKILL.md content
   */
  private parseSkillMetadata(content: string): {
    name?: string;
    version?: string;
    description?: string;
  } {
    const metadata: { name?: string; version?: string; description?: string } = {};

    // Extract front matter if present
    const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (frontMatterMatch) {
      const frontMatter = frontMatterMatch[1];
      const nameMatch = frontMatter.match(/^name:\s*(.+)$/m);
      const versionMatch = frontMatter.match(/^version:\s*(.+)$/m);
      const descMatch = frontMatter.match(/^description:\s*(.+)$/m);

      if (nameMatch) metadata.name = nameMatch[1].trim();
      if (versionMatch) metadata.version = versionMatch[1].trim();
      if (descMatch) metadata.description = descMatch[1].trim();
    }

    // Extract from first heading if no front matter
    if (!metadata.name) {
      const headingMatch = content.match(/^#\s+(.+)$/m);
      if (headingMatch) {
        metadata.name = headingMatch[1].trim();
      }
    }

    // Extract description from first paragraph
    if (!metadata.description) {
      const paragraphMatch = content.match(/\n\n(.+?)(?:\n\n|$)/);
      if (paragraphMatch) {
        metadata.description = paragraphMatch[1].trim();
      }
    }

    return metadata;
  }

  /**
   * Collect all files in a skill directory
   */
  private async collectSkillFiles(dir: string, baseDir: string = dir): Promise<ResourceFile[]> {
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

      if (entry.isDirectory()) {
        const subFiles = await this.collectSkillFiles(fullPath, baseDir);
        files.push(...subFiles);
      } else if (entry.isFile()) {
        const content = await readFile(fullPath, 'utf-8');
        const stats = await stat(fullPath);

        files.push({
          path: relative(baseDir, fullPath),
          content,
          mode: stats.mode,
        });
      }
    }

    return files;
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
