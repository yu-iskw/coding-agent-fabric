/**
 * CLI type definitions
 */

import type { AgentType, Scope } from '@coding-agent-fabric/common';

/**
 * Common CLI options
 */
export interface CommonOptions {
  global?: boolean;
  force?: boolean;
  yes?: boolean;
  agent?: AgentType;
}

/**
 * Add command options
 */
export interface AddOptions extends CommonOptions {
  scope?: Scope;
  mode?: 'copy' | 'symlink';
  categories?: string[];
  namingStrategy?: string;
}

/**
 * List command options
 */
export interface ListOptions {
  global?: boolean;
  project?: boolean;
  all?: boolean;
}

/**
 * Remove command options
 */
export interface RemoveOptions extends CommonOptions {
  scope?: Scope;
}

/**
 * Update command options
 */
export interface UpdateOptions extends CommonOptions {
  checkOnly?: boolean;
}

/**
 * CLI context
 */
export interface CLIContext {
  projectRoot: string;
  globalRoot?: string;
  verbose?: boolean;
}
