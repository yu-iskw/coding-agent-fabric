/**
 * @coding-agent-fabric/core
 *
 * Core system layer for coding-agent-fabric
 */

// Export LockManager
export { LockManager } from './lock-manager.js';
export type { LockManagerOptions } from './lock-manager.js';

// Export AgentRegistry
export { AgentRegistry } from './agent-registry.js';

// Export SkillsHandler
export { SkillsHandler } from './skills-handler.js';
export type { SkillsHandlerOptions } from './skills-handler.js';

// Export SubagentsHandler
export { SubagentsHandler } from './subagents-handler.js';
export type { SubagentsHandlerOptions } from './subagents-handler.js';

// Export PluginManager
export { PluginManager } from './plugin-manager.js';

// Export SourceParser
export { SourceParser } from './source-parser.js';
export type { DownloadOptions, SourceParseResult } from './source-parser.js';

// Re-export common types for convenience
export type {
  LockFile,
  ResourceLockEntry,
  SkillLockEntry,
  SubagentLockEntry,
  PluginResourceLockEntry,
  PluginLockEntry,
  LockFileConfig,
  SourceMetadata,
  AgentConfig,
  AgentType,
  ParsedSource,
  Resource,
  ResourceFile,
  InstalledResource,
  ValidationResult,
  UpdateCheck,
  Scope,
  InstallMode,
  SourceType,
  NamingStrategy,
} from '@coding-agent-fabric/common';
