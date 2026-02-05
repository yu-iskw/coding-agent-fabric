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
  source: string; // Original source (e.g., 'owner/repo', 'npm:package')
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
 * Plugin lock entry
 */
export interface PluginLockEntry {
  version: string;
  installedAt: string;
  enabled: boolean;
  location: PluginLocation;
}

/**
 * Base lock entry
 */
export interface BaseLockEntry {
  type: string; // Discriminator: "skills", "hooks", "subagents", "mcp", etc.
  handler: string; // "built-in" or plugin ID (e.g., "@coding-agent-fabric/plugin-claude-code-hooks")
  name: string;
  version?: string;
  source: string; // "owner/repo", "npm:package", "local:./path"
  sourceType: SourceType;
  sourceUrl: string;
  installedAt: string;
  updatedAt: string;
  installedFor: {
    agent: AgentType;
    scope: Scope;
    path: string;
  }[];
  history?: {
    version?: string;
    updatedAt: string;
    sourceUrl: string;
    metadata?: Record<string, unknown>;
  }[];
}

/**
 * Skill lock entry
 */
export interface SkillLockEntry extends BaseLockEntry {
  type: 'skills';
  handler: 'built-in'; // Skills are core
  originalName: string; // Original name from SKILL.md
  installedName: string; // Name after conflict resolution
  sourcePath: string; // Path in source repo (e.g., "skills/frontend/react/patterns")
  categories: string[]; // Extracted from source path
  namingStrategy?: NamingStrategy;
  skillFolderHash?: string; // GitHub tree SHA for update detection
}

/**
 * Subagent lock entry
 */
export interface SubagentLockEntry extends BaseLockEntry {
  type: 'subagents';
  handler: 'built-in'; // Subagents are core
  model?: string; // Model identifier (e.g., "claude-sonnet-4")
  format: 'claude-code-yaml' | 'coding-agent-fabric-json'; // Source format
  configHash: string;
}

/**
 * Plugin resource lock entry (for hooks, MCP, etc.)
 */
export interface PluginResourceLockEntry extends BaseLockEntry {
  type: string; // Resource type (e.g., "hooks", "mcp")
  handler: string; // Plugin ID (e.g., "@coding-agent-fabric/plugin-claude-code-hooks")
  metadata: Record<string, unknown>; // Plugin-specific metadata
}

/**
 * Union type for all lock entry types
 */
export type ResourceLockEntry = SkillLockEntry | SubagentLockEntry | PluginResourceLockEntry;

/**
 * Source metadata for tracking updates
 */
export interface SourceMetadata {
  lastChecked: string; // ISO 8601 timestamp
  availableUpdates: Record<string, string>; // resource name -> latest version
}

/**
 * Lock file configuration
 */
export interface LockFileConfig {
  preferredAgents: AgentType[]; // Default agents for new resources
  defaultScope: Scope;
  historyLimit?: number; // Max history entries per resource (default: 10)
  updateStrategy?: UpdateStrategy; // Default: parallel
  namingStrategy?: NamingStrategy; // Default naming strategy for skills
}

/**
 * Lock file structure (version 2)
 */
export interface LockFile {
  version: 2;
  lastUpdated: string; // ISO 8601 timestamp

  // Configuration
  config: LockFileConfig;

  // Installed plugins
  plugins: Record<string, PluginLockEntry>;

  // Installed resources
  resources: Record<string, ResourceLockEntry>;

  // Source tracking
  sources?: Record<string, SourceMetadata>;
}
