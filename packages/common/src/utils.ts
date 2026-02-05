/**
 * Utility functions for coding-agent-fabric
 */

import { sep } from 'node:path';
import { ParsedSource, AgentType } from './types.js';

/**
 * Parse a source string into a ParsedSource object
 */
export function parseSource(input: string): ParsedSource {
  // Local path: "./path" or "/absolute/path" (check FIRST to avoid false GitHub matches)
  if (input.startsWith('./') || input.startsWith('/') || input.startsWith('~/')) {
    return {
      type: 'local',
      url: `file://${input}`,
      localPath: input,
    };
  }

  // HTTP/HTTPS URL (check before GitHub to avoid false matches)
  if (input.startsWith('http://') || input.startsWith('https://')) {
    // GitHub URL: "https://github.com/owner/repo"
    const githubUrlMatch = input.match(
      /^https?:\/\/github\.com\/([^/]+)\/([^/#]+)(?:\/tree\/([^/]+)(?:\/(.+))?)?$/,
    );
    if (githubUrlMatch) {
      const [, owner, repo, ref, subpath] = githubUrlMatch;
      return {
        type: 'github',
        url: `https://github.com/${owner}/${repo}`,
        owner,
        repo,
        ref,
        subpath,
      };
    }

    // GitLab URL
    const gitlabUrlMatch = input.match(
      /^https?:\/\/gitlab\.com\/([^/]+)\/([^/#]+)(?:\/-\/tree\/([^/]+)(?:\/(.+))?)?$/,
    );
    if (gitlabUrlMatch) {
      const [, owner, repo, ref, subpath] = gitlabUrlMatch;
      return {
        type: 'gitlab',
        url: `https://gitlab.com/${owner}/${repo}`,
        owner,
        repo,
        ref,
        subpath,
      };
    }

    // Generic HTTP URL
    return {
      type: 'http',
      url: input,
    };
  }

  // GitHub shorthand: "owner/repo"
  const githubShorthandMatch = input.match(/^([^/]+)\/([^/]+)$/);
  if (githubShorthandMatch) {
    const [, owner, repo] = githubShorthandMatch;
    return {
      type: 'github',
      url: `https://github.com/${owner}/${repo}`,
      owner,
      repo,
    };
  }

  // npm package: "npm:package-name" or "@scope/package"
  if (input.startsWith('npm:') || input.startsWith('@')) {
    const npmPackage = input.startsWith('npm:') ? input.slice(4) : input;
    return {
      type: 'npm',
      url: `https://www.npmjs.com/package/${npmPackage}`,
      npmPackage,
    };
  }

  // Registry: "registry:resource-id"
  if (input.startsWith('registry:')) {
    const registryId = input.slice(9);
    return {
      type: 'registry',
      url: input,
      registryId,
    };
  }

  // Fallback: treat as GitHub shorthand
  return {
    type: 'github',
    url: `https://github.com/${input}`,
    owner: input.split('/')[0],
    repo: input.split('/')[1],
  };
}

/**
 * Normalize a path (resolve ~, remove trailing slashes)
 */
export function normalizePath(path: string): string {
  let normalized = path;

  // Expand ~ to home directory
  if (normalized.startsWith('~/')) {
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
    normalized = normalized.replace('~', homeDir);
  }

  // Remove trailing slashes
  normalized = normalized.replace(/[\\/]+$/, '');

  return normalized;
}

/**
 * Check if a string is a valid semantic version
 */
export function isValidSemver(version: string): boolean {
  const semverRegex = /^v?\d+\.\d+\.\d+(?:-[\w.]+)?(?:\+[\w.]+)?$/;
  return semverRegex.test(version);
}

/**
 * Compare two semantic versions
 * Returns: -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
 */
export function compareSemver(v1: string, v2: string): number {
  const clean1 = v1.replace(/^v/, '');
  const clean2 = v2.replace(/^v/, '');

  const parts1 = clean1.split(/[.-]/);
  const parts2 = clean2.split(/[.-]/);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parseInt(parts1[i] || '0', 10);
    const part2 = parseInt(parts2[i] || '0', 10);

    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }

  return 0;
}

/**
 * Get current ISO timestamp
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Ensure a directory path ends with the resource type subdirectory
 */
export function ensureResourceSubdir(basePath: string, resourceType: string): string {
  if (basePath.endsWith(`${sep}${resourceType}`)) {
    return basePath;
  }
  return `${basePath}${sep}${resourceType}`;
}

/**
 * Extract categories from a source path
 * Example: "skills/frontend/react/patterns" -> ["frontend", "react"]
 */
export function extractCategories(sourcePath: string): string[] {
  const parts = sourcePath.split(/[\\/]/);
  // Remove first part (resource type) and last part (resource name)
  if (parts.length <= 2) return [];
  return parts.slice(1, -1);
}

/**
 * Generate a disambiguated name using smart strategy
 * Example: originalName="patterns", categories=["frontend", "react"] -> "frontend-react-patterns"
 */
export function generateSmartName(originalName: string, categories: string[]): string {
  if (categories.length === 0) {
    return originalName;
  }
  return `${categories.join('-')}-${originalName}`;
}

/**
 * Generate a name with full path prefix
 * Example: sourcePath="skills/frontend/react/patterns" -> "skills-frontend-react-patterns"
 */
export function generateFullPathName(sourcePath: string): string {
  return sourcePath.replace(/[\\/]/g, '-');
}

/**
 * Generate a name with category prefix
 * Example: originalName="patterns", categories=["frontend", "react"] -> "frontend-patterns"
 */
export function generateCategoryPrefixName(originalName: string, categories: string[]): string {
  if (categories.length === 0) {
    return originalName;
  }
  return `${categories[0]}-${originalName}`;
}

/**
 * Check if an agent type is supported
 */
export function isSupportedAgent(agent: string): agent is AgentType {
  const knownAgents: AgentType[] = [
    'claude-code',
    'cursor',
    'codex',
    'gemini-cli',
    'windsurf',
    'aider',
    'continue',
    'codeium',
    'github-copilot',
    'amazon-q',
    'tabnine',
    'replit-ai',
    'sourcegraph-cody',
    'vscode-copilot',
  ];
  return knownAgents.includes(agent as AgentType);
}

/**
 * Sleep for a specified duration
 */
export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry an async operation with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    retryDelayMs?: number;
    retryBackoffMultiplier?: number;
  } = {},
): Promise<T> {
  const { maxRetries = 3, retryDelayMs = 1000, retryBackoffMultiplier = 2 } = options;

  let lastError: Error | undefined;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        const delay = retryDelayMs * Math.pow(retryBackoffMultiplier, attempt);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

/**
 * Sanitize a file name (remove invalid characters and prevent path traversal)
 */
export function sanitizeFileName(name: string): string {
  return name
    .replace(/[\\/]/g, '-') // Replace path separators with hyphens
    .replace(/^\.+/, '') // Remove leading dots (prevents hidden files and ../)
    .replace(/[^a-zA-Z0-9._-]/g, '-') // Keep only safe characters
    .replace(/-+/g, '-') // Replace multiple hyphens with one
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Check if a path is inside another path
 */
export function isPathInside(childPath: string, parentPath: string): boolean {
  const normalizedChild = normalizePath(childPath);
  const normalizedParent = normalizePath(parentPath);
  return normalizedChild.startsWith(normalizedParent + sep);
}
