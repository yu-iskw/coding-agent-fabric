/**
 * PluginManager - Manages plugin lifecycle, discovery, and registration
 */

import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve, isAbsolute } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  PluginManifest,
  PluginMetadata,
  PluginRegistry,
  PluginLoader,
  PluginDiscovery,
  ResourceHandler,
} from '@coding-agent-fabric/plugin-api';
import { getCurrentTimestamp } from '@coding-agent-fabric/common';

export class PluginManager implements PluginRegistry, PluginLoader, PluginDiscovery {
  private plugins: Map<string, PluginMetadata> = new Map();
  private handlers: Map<string, ResourceHandler> = new Map();
  private searchPaths: string[] = [];

  constructor(searchPaths: string[] = []) {
    this.searchPaths = searchPaths;
  }

  // PluginRegistry implementation

  register(metadata: PluginMetadata, handler: ResourceHandler): void {
    this.plugins.set(metadata.manifest.id, metadata);
    this.handlers.set(metadata.manifest.resourceType, handler);
  }

  unregister(pluginId: string): void {
    const metadata = this.plugins.get(pluginId);
    if (metadata) {
      this.handlers.delete(metadata.manifest.resourceType);
      this.plugins.delete(pluginId);
    }
  }

  getHandler(resourceType: string): ResourceHandler | undefined {
    return this.handlers.get(resourceType);
  }

  getPlugin(pluginId: string): PluginMetadata | undefined {
    return this.plugins.get(pluginId);
  }

  listPlugins(): PluginMetadata[] {
    return Array.from(this.plugins.values());
  }

  listHandlers(): ResourceHandler[] {
    return Array.from(this.handlers.values());
  }

  hasPlugin(pluginId: string): boolean {
    return this.plugins.has(pluginId);
  }

  hasHandler(resourceType: string): boolean {
    return this.handlers.has(resourceType);
  }

  // PluginLoader implementation

  async load(pluginPath: string): Promise<{
    metadata: PluginMetadata;
    handler: ResourceHandler;
  }> {
    const manifestPath = join(pluginPath, 'plugin.json');
    if (!existsSync(manifestPath)) {
      throw new Error(`Plugin manifest not found at ${manifestPath}`);
    }

    const manifestContent = await readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent) as PluginManifest;

    const errors = this.validateManifest(manifest);
    if (errors.length > 0) {
      throw new Error(`Invalid plugin manifest at ${manifestPath}: ${errors.join(', ')}`);
    }

    const entryPath = resolve(pluginPath, manifest.entry);
    if (!existsSync(entryPath)) {
      throw new Error(`Plugin entry point not found at ${entryPath}`);
    }

    // Load the plugin module
    // We use dynamic import for ESM
    const moduleUrl = pathToFileURL(entryPath).href;
    const pluginModule = await import(moduleUrl);

    // Plugins must export a default object with a createHandler method
    const pluginExport = pluginModule.default || pluginModule;
    if (!pluginExport || typeof pluginExport.createHandler !== 'function') {
      throw new Error(`Plugin at ${entryPath} does not export a valid createHandler function`);
    }

    // Create a mock context for now
    const context = {
      version: '0.1.0',
      configDir: dirname(manifestPath),
      pluginDir: pluginPath,
      log: {
        debug: console.debug,
        info: console.info,
        warn: console.warn,
        error: console.error,
      },
    };

    const handler = (await pluginExport.createHandler(context)) as ResourceHandler;

    const metadata: PluginMetadata = {
      manifest,
      path: pluginPath,
      bundled: pluginPath.includes('packages/plugins'),
      enabled: true,
      loadedAt: getCurrentTimestamp(),
    };

    return { metadata, handler };
  }

  validateManifest(manifest: PluginManifest): string[] {
    const errors: string[] = [];

    if (!manifest.id) errors.push('Missing plugin ID');
    if (!manifest.name) errors.push('Missing plugin name');
    if (!manifest.version) errors.push('Missing plugin version');
    if (!manifest.resourceType) errors.push('Missing resource type');
    if (!manifest.entry) errors.push('Missing entry point');
    if (!manifest.supportedAgents || !Array.isArray(manifest.supportedAgents)) {
      errors.push('Missing supported agents');
    }

    return errors;
  }

  isCompatible(manifest: PluginManifest, currentVersion: string): boolean {
    // Simple version check for now
    return true;
  }

  // PluginDiscovery implementation

  async discover(directory: string): Promise<string[]> {
    if (!existsSync(directory)) {
      return [];
    }

    const entries = await readdir(directory, { withFileTypes: true });
    const pluginPaths: string[] = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const pluginPath = join(directory, entry.name);
        const manifestPath = join(pluginPath, 'plugin.json');
        if (existsSync(manifestPath)) {
          pluginPaths.push(pluginPath);
        }
      }
    }

    return pluginPaths;
  }

  getSearchPaths(): string[] {
    return this.searchPaths;
  }

  /**
   * Load and register all plugins found in search paths
   */
  async loadAll(): Promise<void> {
    for (const path of this.searchPaths) {
      const pluginPaths = await this.discover(path);
      for (const pluginPath of pluginPaths) {
        try {
          const { metadata, handler } = await this.load(pluginPath);
          this.register(metadata, handler);
        } catch (error) {
          console.error(`Failed to load plugin at ${pluginPath}:`, error);
        }
      }
    }
  }
}

function dirname(path: string): string {
  return path.split('/').slice(0, -1).join('/');
}
