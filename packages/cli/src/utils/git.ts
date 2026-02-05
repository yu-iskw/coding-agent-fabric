/**
 * Git utilities
 */

import { simpleGit, SimpleGit } from 'simple-git';
import { rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtemp } from 'node:fs/promises';

/**
 * Check if a source string is a Git URL
 */
export function isGitUrl(source: string): boolean {
  // Common git URL patterns
  const gitUrlPatterns = [
    /^git@.*:.*\.git$/, // SSH
    /^https?:\/\/.*\.git$/, // HTTPS
    /^https?:\/\/github\.com\/[\w-]+\/[\w-]+$/, // GitHub without .git
    /^[\w-]+\/[\w-]+$/, // GitHub shorthand (owner/repo)
  ];

  return gitUrlPatterns.some((pattern) => pattern.test(source));
}

/**
 * Normalize Git URL
 */
export function normalizeGitUrl(source: string): string {
  if (source.startsWith('http') || source.startsWith('git@')) {
    if (!source.endsWith('.git') && source.includes('github.com')) {
      return `${source}.git`;
    }
    return source;
  }

  // Handle GitHub shorthand
  if (/^[\w-]+\/[\w-]+$/.test(source)) {
    return `https://github.com/${source}.git`;
  }

  return source;
}

/**
 * Clone a Git repository to a temporary directory
 */
export async function cloneRepo(
  url: string,
): Promise<{ path: string; cleanup: () => Promise<void> }> {
  const normalizedUrl = normalizeGitUrl(url);
  const tempDirBase = join(tmpdir(), 'caf-git-');
  const tempDir = await mkdtemp(tempDirBase);

  const git: SimpleGit = simpleGit();

  try {
    await git.clone(normalizedUrl, tempDir, ['--depth', '1']);

    return {
      path: tempDir,
      cleanup: async () => {
        if (existsSync(tempDir)) {
          await rm(tempDir, { recursive: true, force: true });
        }
      },
    };
  } catch (error) {
    // Cleanup if clone fails
    if (existsSync(tempDir)) {
      await rm(tempDir, { recursive: true, force: true });
    }
    throw new Error(
      `Failed to clone git repository ${normalizedUrl}: ${error instanceof Error ? error.message : error}`,
    );
  }
}
