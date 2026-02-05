/**
 * Plugin manifest and metadata types
 */

import type { AgentType } from '@coding-agent-fabric/common';

/**
 * Plugin manifest schema (plugin.json)
 */
export interface PluginManifest {
  /** Unique plugin identifier */
  id: string;

  /** Package name (e.g., "@coding-agent-fabric/plugin-claude-code-hooks") */
  name: string;

  /** Semantic version */
  version: string;

  /** Human-readable description */
  description: string;

  /** Author name or organization */
  author: string;

  /** Resource type this plugin handles (e.g., "hooks", "mcp", "custom-configs") */
  resourceType: string;

  /** Supported agent types */
  supportedAgents: AgentType[];

  /** Entry point file path (relative to plugin directory) */
  entry: string;

  /** Plugin dependencies (npm packages) */
  dependencies?: Record<string, string>;

  /** Plugin configuration schema (optional) */
  configSchema?: Record<string, unknown>;

  /** Minimum coding-agent-fabric version required */
  minVersion?: string;

  /** Maximum coding-agent-fabric version supported */
  maxVersion?: string;

  /** Plugin homepage URL */
  homepage?: string;

  /** Plugin repository URL */
  repository?: string;

  /** Plugin license */
  license?: string;

  /** Plugin keywords */
  keywords?: string[];
}

/**
 * Plugin metadata (runtime information)
 */
export interface PluginMetadata {
  /** Plugin manifest */
  manifest: PluginManifest;

  /** Plugin directory path */
  path: string;

  /** Whether plugin is bundled with coding-agent-fabric */
  bundled: boolean;

  /** Whether plugin is enabled */
  enabled: boolean;

  /** Plugin load timestamp */
  loadedAt: string;
}

/**
 * Plugin configuration options
 */
export interface PluginConfig {
  /** Custom configuration values */
  [key: string]: unknown;
}

/**
 * Plugin context provided to plugins at runtime
 */
export interface PluginContext {
  /** coding-agent-fabric version */
  version: string;

  /** Configuration directory path */
  configDir: string;

  /** Plugin directory path */
  pluginDir: string;

  /** Plugin configuration */
  config?: PluginConfig;

  /** Logger instance */
  log: {
    debug: (message: string, ...args: unknown[]) => void;
    info: (message: string, ...args: unknown[]) => void;
    warn: (message: string, ...args: unknown[]) => void;
    error: (message: string, ...args: unknown[]) => void;
  };
  /** Audit instance */
  audit?: {
    success: (
      action: string,
      resourceName: string,
      resourceType: string,
      targetPath?: string,
      details?: Record<string, unknown>,
    ) => void;
    failure: (
      action: string,
      resourceName: string,
      resourceType: string,
      error: string,
      targetPath?: string,
      details?: Record<string, unknown>,
    ) => void;
    warning: (
      action: string,
      resourceName: string,
      resourceType: string,
      details?: Record<string, unknown>,
    ) => void;
  };
}

/**
 * Plugin lifecycle hooks
 */
export interface PluginLifecycle {
  /**
   * Called when plugin is loaded
   */
  onLoad?(context: PluginContext): Promise<void> | void;

  /**
   * Called when plugin is unloaded
   */
  onUnload?(context: PluginContext): Promise<void> | void;

  /**
   * Called when plugin configuration changes
   */
  onConfigChange?(config: PluginConfig, context: PluginContext): Promise<void> | void;
}

/**
 * Plugin export interface
 *
 * Plugins must export a default object that implements ResourceHandler and optionally PluginLifecycle
 */
export interface PluginExport extends PluginLifecycle {
  /** Create a new instance of the resource handler */
  createHandler(context: PluginContext): Promise<unknown> | unknown;
}
