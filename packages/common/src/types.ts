/**
 * Core type definitions for coding-agent-fabric
 */

/**
 * Supported agent types
 */
export type AgentType =
  | 'claude-code'
  | 'cursor'
  | 'codex'
  | 'gemini-cli'
  | 'windsurf'
  | 'aider'
  | 'continue'
  | 'codeium'
  | 'github-copilot'
  | 'amazon-q'
  | 'tabnine'
  | 'replit-ai'
  | 'sourcegraph-cody'
  | 'vscode-copilot'
  | string; // Allow extensibility

/**
 * Resource installation scope
 */
export type Scope = 'global' | 'project';

/**
 * Installation mode
 */
export type InstallMode = 'symlink' | 'copy';

/**
 * Source types for resources
 */
export type SourceType = 'github' | 'gitlab' | 'npm' | 'local' | 'http' | 'registry';

/**
 * Naming strategies for conflict resolution
 */
export type NamingStrategy =
  | 'smart-disambiguation'
  | 'full-path-prefix'
  | 'category-prefix'
  | 'original-name';

/**
 * Update strategy
 */
export type UpdateStrategy = 'parallel' | 'sequential';

/**
 * Source metadata for resources
 */
export interface SourceMetadata {
  downloadedAt: string;
  size: number;
  fileCount: number;
}

/**
 * Parsed source information
 */
export interface ParsedSource {
  type: SourceType;
  url: string;
  owner?: string;
  repo?: string;
  ref?: string; // Branch, tag, or commit
  subpath?: string;
  localPath?: string;
  npmPackage?: string;
  registryId?: string;
}

/**
 * Resource file to be installed
 */
export interface ResourceFile {
  path: string;
  content?: string;
  mode?: number; // File permissions
}

/**
 * Resource dependency
 */
export interface ResourceDependency {
  type: string; // Resource type (e.g., 'skills', 'hooks')
  name: string;
  version?: string;
  optional?: boolean;
}

/**
 * Base resource definition
 */
export interface Resource {
  type: string; // Handler type (e.g., 'skills', 'hooks', 'subagents', 'mcp')
  name: string; // Unique identifier
  version?: string; // Semantic version
  description: string;
  metadata: Record<string, unknown>; // Type-specific metadata
  files: ResourceFile[]; // Files to install
  dependencies?: ResourceDependency[];
}

/**
 * Installation target configuration
 */
export interface InstallTarget {
  agent: AgentType;
  scope: Scope;
  mode: InstallMode;
}

/**
 * Installed resource information
 */
export interface InstalledResource extends Resource {
  source: string; // "owner/repo", "npm:package", "local:./path" - pnpm specifier
  sourceType: SourceType;
  sourceUrl: string;
  installedAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
  installedFor: {
    agent: AgentType;
    scope: Scope;
    path: string;
  }[];
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Update check result
 */
export interface UpdateCheck {
  resourceName: string;
  currentVersion?: string;
  latestVersion?: string;
  updateAvailable: boolean;
  changesSummary?: string;
}

/**
 * Discovery options
 */
export interface DiscoverOptions {
  includeInternal?: boolean; // Include resources marked as internal
  categories?: string[]; // Filter by categories
  namingStrategy?: NamingStrategy; // Naming strategy for conflict resolution
}

/**
 * Installation options
 */
export interface InstallOptions {
  force?: boolean; // Force reinstall
  skipValidation?: boolean;
  dryRun?: boolean;
  yes?: boolean; // Skip confirmation prompts
}

/**
 * Remove options
 */
export interface RemoveOptions {
  force?: boolean;
  yes?: boolean;
}

/**
 * Agent configuration
 */
export interface AgentConfig {
  name: AgentType;
  displayName: string;

  // Resource-specific directories
  skillsDir: string;
  globalSkillsDir?: string;
  hooksDir?: string;
  globalHooksDir?: string;
  subagentsDir?: string;
  globalSubagentsDir?: string;
  mcpConfigFile?: string;
  globalMcpConfigFile?: string;

  // Detection
  detectInstalled: () => Promise<boolean>;
}

/**
 * Plugin location
 */
export type PluginLocation = 'bundled' | 'project' | 'global';

/**
 * Plugin lock entry (kept for plugin compatibility)
 */
export interface PluginLockEntry {
  version: string;
  installedAt: string;
  enabled: boolean;
  location: PluginLocation;
}
