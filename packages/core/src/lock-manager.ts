/**
 * LockManager - Manages the lock file (v2 schema)
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import {
  LockFile,
  ResourceLockEntry,
  SkillLockEntry,
  SubagentLockEntry,
  PluginResourceLockEntry,
  PluginLockEntry,
  SourceMetadata,
  LockFileConfig,
  AgentType,
  Scope,
  getCurrentTimestamp,
} from '@coding-agent-fabric/common';
import {
  LOCK_FILE_VERSION,
  LOCK_FILE_NAME,
  CONFIG_DIR_NAME,
  DEFAULT_UPDATE_STRATEGY,
  DEFAULT_HISTORY_LIMIT,
} from '@coding-agent-fabric/common';

export interface LockManagerOptions {
  projectRoot: string;
  globalRoot?: string;
}

/**
 * LockManager manages the lock file for tracking installed resources
 */
export class LockManager {
  private projectRoot: string;
  private globalRoot?: string;
  private lockFilePath: string;

  constructor(options: LockManagerOptions) {
    this.projectRoot = options.projectRoot;
    this.globalRoot = options.globalRoot;
    this.lockFilePath = join(this.projectRoot, CONFIG_DIR_NAME, LOCK_FILE_NAME);
  }

  /**
   * Initialize a new lock file with default configuration
   */
  async initialize(config?: Partial<LockFileConfig>): Promise<LockFile> {
    const lockFile: LockFile = {
      version: LOCK_FILE_VERSION,
      lastUpdated: getCurrentTimestamp(),
      config: {
        preferredAgents: config?.preferredAgents || [],
        defaultScope: config?.defaultScope || 'project',
        historyLimit: config?.historyLimit || DEFAULT_HISTORY_LIMIT,
        updateStrategy: config?.updateStrategy || DEFAULT_UPDATE_STRATEGY,
        namingStrategy: config?.namingStrategy,
      },
      plugins: {},
      resources: {},
    };

    await this.save(lockFile);
    return lockFile;
  }

  /**
   * Load the lock file from disk
   */
  async load(): Promise<LockFile> {
    if (!existsSync(this.lockFilePath)) {
      return this.initialize();
    }

    try {
      const content = await readFile(this.lockFilePath, 'utf-8');
      const lockFile = JSON.parse(content) as LockFile;

      // Validate version
      if (lockFile.version !== LOCK_FILE_VERSION) {
        throw new Error(
          `Lock file version mismatch: expected ${LOCK_FILE_VERSION}, got ${lockFile.version}`,
        );
      }

      return lockFile;
    } catch (error) {
      throw new Error(`Failed to load lock file: ${error}`);
    }
  }

  /**
   * Save the lock file to disk
   */
  async save(lockFile: LockFile): Promise<void> {
    try {
      // Ensure directory exists
      const dir = dirname(this.lockFilePath);
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }

      // Update lastUpdated timestamp
      lockFile.lastUpdated = getCurrentTimestamp();

      // Write with pretty formatting
      const content = JSON.stringify(lockFile, null, 2);
      await writeFile(this.lockFilePath, content, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to save lock file: ${error}`);
    }
  }

  /**
   * Check if lock file exists
   */
  exists(): boolean {
    return existsSync(this.lockFilePath);
  }

  /**
   * Get lock file path
   */
  getPath(): string {
    return this.lockFilePath;
  }

  /**
   * Add or update a resource entry
   */
  async addResource(entry: ResourceLockEntry): Promise<void> {
    const lockFile = await this.load();
    const existing = lockFile.resources[entry.name];

    if (existing) {
      // Add to history
      const historyEntry = {
        version: existing.version,
        updatedAt: existing.updatedAt,
        source: existing.source,
        metadata: this.getEntryMetadata(existing),
      };

      if (!entry.history) {
        entry.history = existing.history || [];
      }
      entry.history.unshift(historyEntry);

      // Trim history
      const limit = lockFile.config.historyLimit || DEFAULT_HISTORY_LIMIT;
      if (entry.history.length > limit) {
        entry.history = entry.history.slice(0, limit);
      }
    }

    lockFile.resources[entry.name] = entry;
    await this.save(lockFile);
  }

  /**
   * Rollback a resource to a previous version
   */
  async rollbackResource(name: string): Promise<ResourceLockEntry> {
    const lockFile = await this.load();
    const entry = lockFile.resources[name];

    if (!entry) {
      throw new Error(`Resource "${name}" not found`);
    }

    if (!entry.history || entry.history.length === 0) {
      throw new Error(`No history found for resource "${name}"`);
    }

    const newHistory = [...(entry.history || [])];
    const previous = newHistory.shift()!;

    // Preserve the current state in the history for future rollbacks
    const currentHistoryEntry = {
      version: entry.version,
      updatedAt: entry.updatedAt,
      source: entry.source,
      metadata: this.getEntryMetadata(entry),
    };
    newHistory.unshift(currentHistoryEntry);

    const rolledBackEntry: ResourceLockEntry = {
      ...entry,
      version: previous.version,
      source: previous.source,
      updatedAt: getCurrentTimestamp(),
      history: newHistory,
    };

    // Restore metadata from history if available
    if (previous.metadata) {
      this.setEntryMetadata(rolledBackEntry, previous.metadata);
    }

    lockFile.resources[name] = rolledBackEntry;
    await this.save(lockFile);

    return rolledBackEntry;
  }

  /**
   * Helper to get metadata from a lock entry based on its type
   */
  private getEntryMetadata(entry: ResourceLockEntry): Record<string, unknown> | undefined {
    if (entry.type === 'skills') {
      const e = entry as SkillLockEntry;
      return {
        skillFolderHash: e.skillFolderHash,
        categories: e.categories,
        namingStrategy: e.namingStrategy,
        originalName: e.originalName,
        installedName: e.installedName,
        sourcePath: e.sourcePath,
      };
    } else if (entry.type === 'subagents') {
      const e = entry as SubagentLockEntry;
      return {
        model: e.model,
        format: e.format,
        configHash: e.configHash,
      };
    } else {
      return (entry as PluginResourceLockEntry).metadata;
    }
  }

  /**
   * Helper to set metadata on a lock entry based on its type
   */
  private setEntryMetadata(entry: ResourceLockEntry, metadata: Record<string, unknown>): void {
    if (entry.type === 'skills') {
      const e = entry as SkillLockEntry;
      const m = metadata as any;
      if (m.skillFolderHash) e.skillFolderHash = m.skillFolderHash;
      if (m.categories) e.categories = m.categories;
      if (m.namingStrategy) e.namingStrategy = m.namingStrategy;
      if (m.originalName) e.originalName = m.originalName;
      if (m.installedName) e.installedName = m.installedName;
      if (m.sourcePath) e.sourcePath = m.sourcePath;
    } else if (entry.type === 'subagents') {
      const e = entry as SubagentLockEntry;
      const m = metadata as any;
      if (m.model) e.model = m.model;
      if (m.format) e.format = m.format;
      if (m.configHash) e.configHash = m.configHash;
    } else {
      (entry as PluginResourceLockEntry).metadata = metadata;
    }
  }

  /**
   * Remove a resource entry
   */
  async removeResource(name: string): Promise<void> {
    const lockFile = await this.load();
    delete lockFile.resources[name];
    await this.save(lockFile);
  }

  /**
   * Get a resource entry by name
   */
  async getResource(name: string): Promise<ResourceLockEntry | undefined> {
    const lockFile = await this.load();
    return lockFile.resources[name];
  }

  /**
   * Get all resource entries
   */
  async getAllResources(): Promise<Record<string, ResourceLockEntry>> {
    const lockFile = await this.load();
    return lockFile.resources;
  }

  /**
   * Get resources by type
   */
  async getResourcesByType(type: string): Promise<ResourceLockEntry[]> {
    const lockFile = await this.load();
    return Object.values(lockFile.resources).filter((entry) => entry.type === type);
  }

  /**
   * Get resources by handler
   */
  async getResourcesByHandler(handler: string): Promise<ResourceLockEntry[]> {
    const lockFile = await this.load();
    return Object.values(lockFile.resources).filter((entry) => entry.handler === handler);
  }

  /**
   * Get resources installed for a specific agent
   */
  async getResourcesForAgent(agent: AgentType, scope?: Scope): Promise<ResourceLockEntry[]> {
    const lockFile = await this.load();
    return Object.values(lockFile.resources).filter((entry) =>
      entry.installedFor.some(
        (target) => target.agent === agent && (scope === undefined || target.scope === scope),
      ),
    );
  }

  /**
   * Add or update a plugin entry
   */
  async addPlugin(name: string, entry: PluginLockEntry): Promise<void> {
    const lockFile = await this.load();
    lockFile.plugins[name] = entry;
    await this.save(lockFile);
  }

  /**
   * Remove a plugin entry
   */
  async removePlugin(name: string): Promise<void> {
    const lockFile = await this.load();
    delete lockFile.plugins[name];
    await this.save(lockFile);
  }

  /**
   * Get a plugin entry by name
   */
  async getPlugin(name: string): Promise<PluginLockEntry | undefined> {
    const lockFile = await this.load();
    return lockFile.plugins[name];
  }

  /**
   * Get all plugin entries
   */
  async getAllPlugins(): Promise<Record<string, PluginLockEntry>> {
    const lockFile = await this.load();
    return lockFile.plugins;
  }

  /**
   * Update configuration
   */
  async updateConfig(config: Partial<LockFileConfig>): Promise<void> {
    const lockFile = await this.load();
    lockFile.config = { ...lockFile.config, ...config };
    await this.save(lockFile);
  }

  /**
   * Get configuration
   */
  async getConfig(): Promise<LockFileConfig> {
    const lockFile = await this.load();
    return lockFile.config;
  }
}
