/**
 * SkillsHandler - Manages skills resources
 */

import { readFile, writeFile, mkdir, readdir, stat, symlink, rm } from 'node:fs/promises';
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
} from '@coding-agent-fabric/common';
import {
  SKILL_FILE_NAME,
  EXCLUDE_PATTERNS,
  generateSmartName,
  sanitizeFileName,
} from '@coding-agent-fabric/common';
import { ResourceHandler } from '@coding-agent-fabric/plugin-api';
import { AgentRegistry } from './agent-registry.js';
import { LockManager } from './lock-manager.js';

export interface SkillsHandlerOptions {
  agentRegistry: AgentRegistry;
  lockManager: LockManager;
  projectRoot: string;
  globalRoot?: string;
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
  private lockManager: LockManager;
  private projectRoot: string;
  private globalRoot?: string;

  constructor(options: SkillsHandlerOptions) {
    this.agentRegistry = options.agentRegistry;
    this.lockManager = options.lockManager;
    this.projectRoot = options.projectRoot;
    this.globalRoot = options.globalRoot;
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
        // Symlink the skill directory
        if (resource.files.length > 0 && resource.files[0].path) {
          const sourcePath = dirname(resource.files[0].path);
          await symlink(sourcePath, targetPath, 'dir');
        }
      } else {
        // Copy files
        await mkdir(targetPath, { recursive: true });
        for (const file of resource.files) {
          if (file.path && file.content !== undefined) {
            const destPath = join(targetPath, basename(file.path));
            await writeFile(destPath, file.content, {
              mode: file.mode,
            });
          }
        }
      }

      console.log(`Installed skill ${resource.name} to ${targetPath}`);
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
        console.warn(`Skill ${resource.name} not found at ${targetPath}`);
        continue;
      }

      // Remove the skill directory
      await rm(targetPath, { recursive: true, force: true });
      console.log(`Removed skill ${resource.name} from ${targetPath}`);
    }
  }

  /**
   * List installed skills
   */
  async list(scope: 'global' | 'project' | 'both'): Promise<InstalledResource[]> {
    const lockFile = await this.lockManager.load();
    const resources: InstalledResource[] = [];

    // Filter resources by type and scope
    for (const entry of Object.values(lockFile.resources)) {
      if (entry.type !== 'skills') continue;

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
          files: [], // TODO: Load from installed directory
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
  private async collectSkillFiles(dir: string): Promise<ResourceFile[]> {
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
