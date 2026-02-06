/**
 * Constants and configuration for coding-agent-fabric
 */

/**
 * Default lock file version
 */
export const LOCK_FILE_VERSION = 2;

/**
 * Default lock file name
 */
export const LOCK_FILE_NAME = 'lock.json';

/**
 * Default configuration directory name
 */
export const CONFIG_DIR_NAME = '.coding-agent-fabric';

/**
 * Default canonical storage directory for resources
 */
export const CANONICAL_DIR_NAME = '.agents';

/**
 * Default plugin directory name
 */
export const PLUGIN_DIR_NAME = 'plugins';

/**
 * Default naming strategy
 */
export const DEFAULT_NAMING_STRATEGY = 'smart-disambiguation';

/**
 * Default update strategy
 */
export const DEFAULT_UPDATE_STRATEGY = 'parallel';

/**
 * Default history limit for resource updates
 */
export const DEFAULT_HISTORY_LIMIT = 10;

/**
 * Default timeout for operations (ms)
 */
export const DEFAULT_TIMEOUT_MS = 30000;

/**
 * Skill file name
 */
export const SKILL_FILE_NAME = 'SKILL.md';

/**
 * Subagent configuration file names
 */
export const SUBAGENT_FILE_NAMES = ['subagent.json', 'subagent.yaml', 'subagent.yml'];

/**
 * Hook configuration file names
 */
export const HOOK_FILE_NAMES = ['hook.json', 'hooks.json'];

/**
 * MCP configuration file names
 */
export const MCP_FILE_NAMES = ['mcp-server.json', 'mcp.json'];

/**
 * Environment variable to disable update checks
 */
export const DISABLE_UPDATE_CHECK_ENV = 'DISABLE_UPDATE_CHECK';

/**
 * Update check interval (24 hours in ms)
 */
export const UPDATE_CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;

/**
 * Built-in handler identifier
 */
export const BUILT_IN_HANDLER = 'built-in';

/**
 * Core resource types (built-in)
 */
export const CORE_RESOURCE_TYPES = ['skills', 'subagents', 'rules'] as const;

/**
 * Rule file extensions
 */
export const RULE_FILE_EXTENSIONS = ['.md', '.mdc'] as const;

/**
 * Bundled plugin IDs
 */
export const BUNDLED_PLUGINS = [
  '@coding-agent-fabric/plugin-claude-code-hooks',
  '@coding-agent-fabric/plugin-cursor-hooks',
  'coding-agent-fabric-plugin-gemini-cli-hooks',
  '@coding-agent-fabric/plugin-mcp',
] as const;

/**
 * Exit codes
 */
export const EXIT_CODES = {
  SUCCESS: 0,
  GENERAL_ERROR: 1,
  INVALID_ARGUMENT: 2,
  NOT_FOUND: 3,
  ALREADY_EXISTS: 4,
  PERMISSION_DENIED: 5,
  NETWORK_ERROR: 6,
  VALIDATION_ERROR: 7,
  PLUGIN_NOT_FOUND: 8,
} as const;

/**
 * Common file patterns to exclude during discovery
 */
export const EXCLUDE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.DS_Store',
  '*.log',
  '.env',
  '.env.*',
] as const;

/**
 * Supported archive formats
 */
export const SUPPORTED_ARCHIVE_FORMATS = ['.zip', '.tar.gz', '.tgz', '.tar'] as const;

/**
 * GitHub API base URL
 */
export const GITHUB_API_BASE = 'https://api.github.com';

/**
 * GitLab API base URL
 */
export const GITLAB_API_BASE = 'https://gitlab.com/api/v4';

/**
 * npm registry URL
 */
export const NPM_REGISTRY_URL = 'https://registry.npmjs.org';

/**
 * Default registry URL for skills.sh integration
 */
export const DEFAULT_REGISTRY_URL = 'https://api.skills.sh';

/**
 * User agent for HTTP requests
 */
export const USER_AGENT = 'coding-agent-fabric';

/**
 * Maximum parallel operations
 */
export const MAX_PARALLEL_OPERATIONS = 5;

/**
 * Retry configuration
 */
export const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelayMs: 1000,
  retryBackoffMultiplier: 2,
} as const;
