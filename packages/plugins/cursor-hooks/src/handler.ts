/**
 * Cursor Hooks Resource Handler
 *
 * Manages hooks for Cursor IDE
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
 * Cursor Hook metadata
 */
interface CursorHookMetadata {
  hookType: string; // e.g., "onSave", "onCommit", "onFileOpen"
  filePattern?: string; // Glob pattern for files this hook applies to
  description: string;
}

/**
 * Cursor Hooks Handler
 */
export class CursorHooksHandler extends BaseResourceHandler {
  readonly type = 'cursor-hooks';
  readonly displayName = 'Cursor Hooks';
  readonly description = 'Manages hooks for Cursor IDE';
  readonly isCore = false;

  constructor(private context: PluginContext) {
    super();
  }

  /**
   * Discover hooks from a source
   */
  async discover(source: ParsedSource, _options?: DiscoverOptions): Promise<Resource[]> {
    const resources: Resource[] = [];

    // Handle local path discovery
    if (source.type === 'local' && source.localPath) {
      const hooksDir = source.localPath;

      try {
        const entries = await fs.readdir(hooksDir, { withFileTypes: true });

        for (const entry of entries) {
          if (entry.isFile() && entry.name.endsWith('.json')) {
            const hookPath = safeJoin(hooksDir, entry.name);
            const content = await fs.readFile(hookPath, 'utf-8');
            const hookConfig = JSON.parse(content);

            // Validate it's a Cursor hook
            if (this.isValidHookConfig(hookConfig)) {
              resources.push({
                type: this.type,
                name: path.basename(entry.name, '.json'),
                description: hookConfig.description || 'Cursor hook',
                metadata: {
                  hookType: hookConfig.hookType,
                  filePattern: hookConfig.filePattern,
                  description: hookConfig.description || 'Cursor hook',
                } as Record<string, unknown>,
                files: [
                  {
                    path: entry.name,
                    content,
                  },
                ],
              });
            }
          }
        }
      } catch (error) {
        this.context.log.warn(`Failed to discover hooks from ${hooksDir}:`, error);
      }
    }

    return resources;
  }

  /**
   * Discover hooks from a local directory path
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
   * Install a hook
   */
  async install(
    resource: Resource,
    targets: InstallTarget[],
    options: InstallOptions,
  ): Promise<void> {
    for (const target of targets) {
      if (target.agent !== 'cursor') {
        throw new Error(`Cursor hooks only support cursor agent, got ${target.agent}`);
      }

      const installPath = this.getInstallPath(target.agent, target.scope);

      // Ensure directory exists
      await fs.mkdir(installPath, { recursive: true });

      // Install each file
      for (const file of resource.files) {
        const targetPath = safeJoin(installPath, file.path);

        if (!options.force) {
          try {
            await fs.access(targetPath);
            throw new Error(`Hook already exists: ${targetPath}. Use --force to overwrite.`);
          } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
              throw error;
            }
          }
        }

        if (file.content) {
          await fs.writeFile(targetPath, file.content, 'utf-8');
          this.context.audit?.success('install-hook', resource.name, this.type, targetPath, {
            agent: target.agent,
            scope: target.scope,
            hookType: (resource.metadata as unknown as CursorHookMetadata).hookType,
          });
        }
      }
    }
  }

  /**
   * Remove a hook
   */
  async remove(
    resource: Resource,
    targets: InstallTarget[],
    options: RemoveOptions,
  ): Promise<void> {
    for (const target of targets) {
      const installPath = this.getInstallPath(target.agent, target.scope);

      for (const file of resource.files) {
        const targetPath = safeJoin(installPath, file.path);

        try {
          await fs.unlink(targetPath);
          this.context.audit?.success('remove-hook', resource.name, this.type, targetPath, {
            agent: target.agent,
            scope: target.scope,
          });
        } catch (error) {
          if (!options.force) {
            this.context.audit?.failure(
              'remove-hook',
              resource.name,
              this.type,
              (error as Error).message,
              targetPath,
            );
            throw error;
          }
          this.context.audit?.warning('remove-hook-failed', resource.name, this.type, {
            targetPath,
            error: (error as Error).message,
          });
        }
      }
    }
  }

  /**
   * List installed hooks
   */
  async list(scope: 'global' | 'project' | 'both'): Promise<ListResult> {
    const resources: InstalledResource[] = [];
    const errors: ListError[] = [];
    const scopes: Scope[] = scope === 'both' ? ['global', 'project'] : [scope];

    for (const s of scopes) {
      const installPath = this.getInstallPath('cursor', s);

      try {
        const entries = await fs.readdir(installPath, { withFileTypes: true });

        for (const entry of entries) {
          if (entry.isFile() && entry.name.endsWith('.json')) {
            const hookPath = safeJoin(installPath, entry.name);
            const content = await fs.readFile(hookPath, 'utf-8');
            const hookConfig = JSON.parse(content);

            if (this.isValidHookConfig(hookConfig)) {
              const stats = await fs.stat(hookPath);

              resources.push({
                type: this.type,
                name: path.basename(entry.name, '.json'),
                description: hookConfig.description || 'Cursor hook',
                metadata: {
                  hookType: hookConfig.hookType,
                  filePattern: hookConfig.filePattern,
                  description: hookConfig.description || 'Cursor hook',
                } as Record<string, unknown>,
                files: [{ path: entry.name, content }],
                source: 'local',
                sourceType: 'local',
                sourceUrl: hookPath,
                installedAt: stats.birthtime.toISOString(),
                updatedAt: stats.mtime.toISOString(),
                installedFor: [
                  {
                    agent: 'cursor',
                    scope: s,
                    path: hookPath,
                  },
                ],
              });
            }
          }
        }
      } catch (error) {
        // Directory doesn't exist is common and not an error
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          this.context.log.debug(`Hooks directory not found at ${installPath}`);
          continue;
        }

        const errorMessage = error instanceof Error ? error.message : String(error);
        this.context.audit?.failure('list', 'cursor-hooks', this.type, errorMessage, installPath);

        let displayPath = installPath;
        const home = os.homedir();
        if (displayPath.startsWith(home)) {
          displayPath = displayPath.replace(home, '~');
        }

        errors.push({
          agent: 'cursor',
          scope: s,
          error: `Failed to access hooks in ${displayPath}: ${errorMessage}`,
        });
      }
    }

    return {
      resources,
      errors,
    };
  }

  /**
   * Validate a hook configuration
   */
  async validate(resource: Resource): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check metadata
    const metadata = resource.metadata as unknown as CursorHookMetadata;

    if (!metadata.hookType) {
      errors.push('Missing hookType in metadata');
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
          const config = JSON.parse(file.content);
          if (!this.isValidHookConfig(config)) {
            errors.push(`Invalid hook configuration in ${file.path}`);
          }
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
    return ['cursor'];
  }

  /**
   * Get installation path for an agent
   */
  getInstallPath(agent: AgentType, scope: Scope): string {
    if (agent !== 'cursor') {
      throw new Error(`Unsupported agent: ${agent}`);
    }

    if (scope === 'global') {
      return path.join(os.homedir(), '.cursor', 'hooks');
    } else {
      // Project scope
      return path.join(process.cwd(), '.cursor', 'hooks');
    }
  }

  /**
   * Check if a configuration is a valid Cursor hook
   */
  private isValidHookConfig(config: Record<string, unknown>): boolean {
    return (
      config &&
      typeof config === 'object' &&
      typeof config.hookType === 'string' &&
      typeof config.command === 'string'
    );
  }
}
