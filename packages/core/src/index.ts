/**
 * @coding-agent-fabric/core
 *
 * Core system layer for coding-agent-fabric
 */

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

// Export AuditLogger
export { AuditLogger, auditLogger } from './audit-logger.js';
export type { AuditLoggerOptions } from './audit-logger.js';

// Re-export common types for convenience
export type {
  PluginLockEntry,
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
