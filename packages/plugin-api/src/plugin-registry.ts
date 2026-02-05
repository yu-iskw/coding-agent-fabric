/**
 * Plugin registry and loader types
 */

import type { ResourceHandler } from './resource-handler.js';
import type { PluginManifest, PluginMetadata } from './plugin-manifest.js';

/**
 * Plugin registry interface
 *
 * Manages loaded plugins and their resource handlers
 */
export interface PluginRegistry {
  /**
   * Register a plugin
   *
   * @param metadata - Plugin metadata
   * @param handler - Resource handler instance
   */
  register(metadata: PluginMetadata, handler: ResourceHandler): void;

  /**
   * Unregister a plugin
   *
   * @param pluginId - Plugin identifier
   */
  unregister(pluginId: string): void;

  /**
   * Get a resource handler by resource type
   *
   * @param resourceType - Resource type (e.g., "skills", "hooks")
   * @returns Resource handler or undefined if not found
   */
  getHandler(resourceType: string): ResourceHandler | undefined;

  /**
   * Get plugin metadata by plugin ID
   *
   * @param pluginId - Plugin identifier
   * @returns Plugin metadata or undefined if not found
   */
  getPlugin(pluginId: string): PluginMetadata | undefined;

  /**
   * List all registered plugins
   *
   * @returns Array of plugin metadata
   */
  listPlugins(): PluginMetadata[];

  /**
   * List all registered resource handlers
   *
   * @returns Array of resource handlers
   */
  listHandlers(): ResourceHandler[];

  /**
   * Check if a plugin is registered
   *
   * @param pluginId - Plugin identifier
   * @returns True if plugin is registered
   */
  hasPlugin(pluginId: string): boolean;

  /**
   * Check if a resource type has a handler
   *
   * @param resourceType - Resource type
   * @returns True if handler exists
   */
  hasHandler(resourceType: string): boolean;
}

/**
 * Plugin loader interface
 *
 * Loads plugins from various sources
 */
export interface PluginLoader {
  /**
   * Load a plugin from a directory
   *
   * @param pluginPath - Path to plugin directory
   * @returns Plugin metadata and handler
   */
  load(pluginPath: string): Promise<{
    metadata: PluginMetadata;
    handler: ResourceHandler;
  }>;

  /**
   * Validate a plugin manifest
   *
   * @param manifest - Plugin manifest to validate
   * @returns Validation errors (empty if valid)
   */
  validateManifest(manifest: PluginManifest): string[];

  /**
   * Check if a plugin is compatible with current coding-agent-fabric version
   *
   * @param manifest - Plugin manifest
   * @param currentVersion - Current coding-agent-fabric version
   * @returns True if compatible
   */
  isCompatible(manifest: PluginManifest, currentVersion: string): boolean;
}

/**
 * Plugin discovery interface
 *
 * Discovers plugins from configured locations
 */
export interface PluginDiscovery {
  /**
   * Discover plugins in a directory
   *
   * @param directory - Directory to search
   * @returns Array of plugin paths
   */
  discover(directory: string): Promise<string[]>;

  /**
   * Get plugin search paths
   *
   * @returns Array of directories to search for plugins
   */
  getSearchPaths(): string[];
}

/**
 * Plugin installation source
 */
export type PluginSource =
  | { type: 'npm'; package: string }
  | { type: 'github'; owner: string; repo: string; ref?: string }
  | { type: 'local'; path: string }
  | { type: 'url'; url: string };

/**
 * Plugin installer interface
 *
 * Installs plugins from various sources
 */
export interface PluginInstaller {
  /**
   * Install a plugin from a source
   *
   * @param source - Plugin source
   * @param destination - Installation directory
   * @returns Path to installed plugin
   */
  install(source: PluginSource, destination: string): Promise<string>;

  /**
   * Uninstall a plugin
   *
   * @param pluginPath - Path to plugin directory
   */
  uninstall(pluginPath: string): Promise<void>;

  /**
   * Update a plugin
   *
   * @param pluginPath - Path to plugin directory
   * @param target - Target version (optional)
   */
  update(pluginPath: string, target?: string): Promise<void>;
}
