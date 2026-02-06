/**
 * coding-agent-fablic-plugin-api
 *
 * Plugin API and base interfaces for coding-agent-fabric resource handlers
 */

// Export resource handler interface
export * from './resource-handler.js';

// Export plugin manifest types
export * from './plugin-manifest.js';

// Export plugin registry types
export * from './plugin-registry.js';

// Re-export commonly used types from @coding-agent-fabric/common
export type {
  AgentType,
  Resource,
  InstallTarget,
  ParsedSource,
  InstalledResource,
  ValidationResult,
  UpdateCheck,
  DiscoverOptions,
  InstallOptions,
  RemoveOptions,
  Scope,
} from '@coding-agent-fabric/common';
