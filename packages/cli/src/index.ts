/**
 * @coding-agent-fabric/cli
 *
 * Command-line interface for coding-agent-fabric
 */

// Export CLI components
export { createSkillsCommand } from './commands/skills.js';
export { createSubagentsCommand } from './commands/subagents.js';

// Export utilities
export { logger, Logger } from './utils/logger.js';
export { spinner, Spinner } from './utils/spinner.js';
export * from './utils/prompts.js';

// Export types
export type * from './types/index.js';
