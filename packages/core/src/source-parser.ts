/**
 * SourceParser - Handles downloading and parsing resources from different sources
 */

import { readdir, readFile, stat, mkdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve, basename, dirname, sep, relative, isAbsolute } from 'node:path';
import { tmpdir } from 'node:os';
import { Readable } from 'node:stream';
import * as tar from 'tar';
import {
  ParsedSource,
  ResourceFile,
  parseSource,
  normalizePath,
  retry,
  getCurrentTimestamp,
  safeJoin,
} from '@coding-agent-fabric/common';
import {
  GITHUB_API_BASE,
  GITLAB_API_BASE,
  NPM_REGISTRY_URL,
  DEFAULT_REGISTRY_URL,
  USER_AGENT,
  RETRY_CONFIG,
  EXCLUDE_PATTERNS,
} from '@coding-agent-fabric/common';
import { auditLogger, AuditLogger } from './audit-logger.js';

export interface DownloadOptions {
  /** Target directory for downloaded files */
  targetDir?: string;
  /** Whether to extract archives */
  extract?: boolean;
  /** Whether to follow symlinks */
  followSymlinks?: boolean;
  /** Custom headers for HTTP requests */
  headers?: Record<string, string>;
}

export interface SourceParseResult {
  /** Parsed source information */
  source: ParsedSource;
  /** Local directory containing the downloaded files */
  localDir: string;
  /** List of resource files */
  files: ResourceFile[];
  /** Metadata about the source */
  metadata: {
    downloadedAt: string;
    size: number;
    fileCount: number;
  };
}

/**
 * SourceParser handles downloading and parsing resources from different sources
 */
export class SourceParser {
  private cacheDir: string;
  private auditLogger: AuditLogger;

  constructor(options: { cacheDir?: string; auditLogger?: AuditLogger } = {}) {
    this.cacheDir = options.cacheDir || join(tmpdir(), 'coding-agent-fabric-cache');
    this.auditLogger = options.auditLogger || auditLogger;
  }

  /**
   * Parse and download a source
   */
  async parse(input: string, options: DownloadOptions = {}): Promise<SourceParseResult> {
    const source = parseSource(input);

    // Ensure cache directory exists
    await this.ensureDir(this.cacheDir);

    switch (source.type) {
      case 'github':
        return this.parseGitHub(source, options);
      case 'gitlab':
        return this.parseGitLab(source, options);
      case 'npm':
        return this.parseNpm(source, options);
      case 'local':
        return this.parseLocal(source, options);
      case 'http':
        return this.parseHttp(source, options);
      case 'registry':
        return this.parseRegistry(source, options);
      default:
        throw new Error(`Unsupported source type: ${source.type}`);
    }
  }

  /**
   * Parse a GitHub source
   */
  private async parseGitHub(
    source: ParsedSource,
    options: DownloadOptions,
  ): Promise<SourceParseResult> {
    const { owner, repo, ref, subpath } = source;
    if (!owner || !repo) {
      throw new Error('Invalid GitHub source: missing owner or repo');
    }

    // Create target directory
    const targetDir =
      options.targetDir || join(this.cacheDir, 'github', owner, repo, ref || 'main');
    await this.ensureDir(targetDir);

    // Use GitHub API to download the tree
    const apiUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/tarball/${ref || 'main'}`;

    try {
      const files = await this.downloadAndExtractTarball(apiUrl, targetDir, subpath, {
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'application/vnd.github.v3+json',
          ...options.headers,
        },
      });

      return {
        source,
        localDir: targetDir,
        files,
        metadata: {
          downloadedAt: getCurrentTimestamp(),
          size: await this.getDirectorySize(targetDir),
          fileCount: files.length,
        },
      };
    } catch (error) {
      throw new Error(`Failed to download GitHub source: ${error}`);
    }
  }

  /**
   * Parse a GitLab source
   */
  private async parseGitLab(
    source: ParsedSource,
    options: DownloadOptions,
  ): Promise<SourceParseResult> {
    const { owner, repo, ref, subpath } = source;
    if (!owner || !repo) {
      throw new Error('Invalid GitLab source: missing owner or repo');
    }

    // Create target directory
    const targetDir =
      options.targetDir || join(this.cacheDir, 'gitlab', owner, repo, ref || 'main');
    await this.ensureDir(targetDir);

    // Use GitLab API to download the archive
    const projectId = encodeURIComponent(`${owner}/${repo}`);
    const apiUrl = `${GITLAB_API_BASE}/projects/${projectId}/repository/archive.tar.gz?sha=${ref || 'main'}`;

    try {
      const files = await this.downloadAndExtractTarball(apiUrl, targetDir, subpath, {
        headers: {
          'User-Agent': USER_AGENT,
          ...options.headers,
        },
      });

      return {
        source,
        localDir: targetDir,
        files,
        metadata: {
          downloadedAt: getCurrentTimestamp(),
          size: await this.getDirectorySize(targetDir),
          fileCount: files.length,
        },
      };
    } catch (error) {
      throw new Error(`Failed to download GitLab source: ${error}`);
    }
  }

  /**
   * Parse an npm package
   */
  private async parseNpm(
    source: ParsedSource,
    options: DownloadOptions,
  ): Promise<SourceParseResult> {
    const { npmPackage } = source;
    if (!npmPackage) {
      throw new Error('Invalid npm source: missing package name');
    }

    // Create target directory
    const targetDir = options.targetDir || join(this.cacheDir, 'npm', npmPackage);
    await this.ensureDir(targetDir);

    // Get package metadata from npm registry
    const apiUrl = `${NPM_REGISTRY_URL}/${npmPackage}`;

    try {
      const response = await retry(async () => {
        const res = await fetch(apiUrl, {
          headers: {
            'User-Agent': USER_AGENT,
            ...options.headers,
          },
        });
        if (!res.ok) {
          throw new Error(`npm registry returned ${res.status}: ${res.statusText}`);
        }
        return res.json();
      }, RETRY_CONFIG);

      // Download the tarball
      const latestVersion = response['dist-tags']?.latest;
      const tarballUrl = response.versions?.[latestVersion]?.dist?.tarball;

      if (!tarballUrl) {
        throw new Error('Failed to get tarball URL from npm registry');
      }

      const files = await this.downloadAndExtractTarball(tarballUrl, targetDir, undefined, {
        headers: options.headers,
      });

      return {
        source,
        localDir: targetDir,
        files,
        metadata: {
          downloadedAt: getCurrentTimestamp(),
          size: await this.getDirectorySize(targetDir),
          fileCount: files.length,
        },
      };
    } catch (error) {
      throw new Error(`Failed to download npm package: ${error}`);
    }
  }

  /**
   * Parse a local source
   */
  private async parseLocal(
    source: ParsedSource,
    _options: DownloadOptions,
  ): Promise<SourceParseResult> {
    const { localPath } = source;
    if (!localPath) {
      throw new Error('Invalid local source: missing path');
    }

    const resolvedPath = resolve(normalizePath(localPath));

    if (!existsSync(resolvedPath)) {
      throw new Error(`Local path does not exist: ${resolvedPath}`);
    }

    const files = await this.listFiles(resolvedPath);

    return {
      source,
      localDir: resolvedPath,
      files,
      metadata: {
        downloadedAt: getCurrentTimestamp(),
        size: await this.getDirectorySize(resolvedPath),
        fileCount: files.length,
      },
    };
  }

  /**
   * Parse an HTTP source
   */
  private async parseHttp(
    source: ParsedSource,
    options: DownloadOptions,
  ): Promise<SourceParseResult> {
    const { url } = source;

    // Create target directory
    const targetDir = options.targetDir || join(this.cacheDir, 'http', basename(url));
    await this.ensureDir(targetDir);

    try {
      const files = await this.downloadAndExtractTarball(url, targetDir, undefined, {
        headers: {
          'User-Agent': USER_AGENT,
          ...options.headers,
        },
      });

      return {
        source,
        localDir: targetDir,
        files,
        metadata: {
          downloadedAt: getCurrentTimestamp(),
          size: await this.getDirectorySize(targetDir),
          fileCount: files.length,
        },
      };
    } catch (error) {
      throw new Error(`Failed to download HTTP source: ${error}`);
    }
  }

  /**
   * Parse a registry source
   */
  private async parseRegistry(
    source: ParsedSource,
    options: DownloadOptions,
  ): Promise<SourceParseResult> {
    const { registryId } = source;
    if (!registryId) {
      throw new Error('Invalid registry source: missing registry ID');
    }

    // Create target directory
    const targetDir = options.targetDir || join(this.cacheDir, 'registry', registryId);
    await this.ensureDir(targetDir);

    // Fetch resource metadata from registry
    const apiUrl = `${DEFAULT_REGISTRY_URL}/resources/${registryId}`;

    try {
      const response = await retry(async () => {
        const res = await fetch(apiUrl, {
          headers: {
            'User-Agent': USER_AGENT,
            ...options.headers,
          },
        });
        if (!res.ok) {
          throw new Error(`Registry returned ${res.status}: ${res.statusText}`);
        }
        return res.json();
      }, RETRY_CONFIG);

      // Download the resource using the download URL from registry
      const downloadUrl = response.downloadUrl;
      if (!downloadUrl) {
        throw new Error('Registry response missing downloadUrl');
      }

      const files = await this.downloadAndExtractTarball(downloadUrl, targetDir, undefined, {
        headers: options.headers,
      });

      return {
        source,
        localDir: targetDir,
        files,
        metadata: {
          downloadedAt: getCurrentTimestamp(),
          size: await this.getDirectorySize(targetDir),
          fileCount: files.length,
        },
      };
    } catch (error) {
      throw new Error(`Failed to download registry resource: ${error}`);
    }
  }

  /**
   * Download and extract a tarball
   */
  private async downloadAndExtractTarball(
    url: string,
    targetDir: string,
    subpath?: string,
    options?: { headers?: Record<string, string> },
  ): Promise<ResourceFile[]> {
    const response = await retry(async () => {
      const res = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          ...options?.headers,
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to download tarball from ${url}: ${res.statusText}`);
      }
      return res;
    }, RETRY_CONFIG);

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create a temporary directory for extraction
    const tempExtractDir = join(tmpdir(), `caf-extract-${Date.now()}`);
    await this.ensureDir(tempExtractDir);

    try {
      // Extract the tarball
      await new Promise((resolve, reject) => {
        const stream = Readable.from(buffer);
        stream
          .pipe(
            tar.x({
              cwd: tempExtractDir,
              filter: (path) => {
                // Prevent path traversal by ensuring no ".." parts
                const isTraversal = path.split(/[\\/]/).some((part) => part === '..');
                // Also prevent absolute paths (though tar.x usually handles this)
                const isAbsolute = path.startsWith('/') || /^[A-Z]:\\/i.test(path);
                return !isTraversal && !isAbsolute;
              },
            }),
          )
          .on('finish', resolve)
          .on('error', reject);
      });

      // Find the actual content directory (usually the first subdirectory in the tarball)
      const entries = await readdir(tempExtractDir, { withFileTypes: true });
      const topLevelDir = entries.find((e) => e.isDirectory());

      if (!topLevelDir) {
        throw new Error('Tarball is empty or invalid (no top-level directory found)');
      }

      const sourceDir = subpath
        ? join(tempExtractDir, topLevelDir.name, subpath)
        : join(tempExtractDir, topLevelDir.name);

      if (!existsSync(sourceDir)) {
        throw new Error(`Subpath "${subpath}" not found in tarball`);
      }

      // List files from the source directory
      const files = await this.listFiles(sourceDir);

      // Copy files to target directory
      for (const file of files) {
        try {
          const targetPath = safeJoin(targetDir, file.path);
          await this.ensureDir(dirname(targetPath));
          if (file.content !== undefined) {
            await writeFile(targetPath, file.content, { mode: file.mode });
          }
        } catch (error) {
          this.auditLogger.warning('source-parser-file-security-skip', file.path, 'source-parser', {
            error: (error as Error).message,
            targetDir,
          });
        }
      }

      return files;
    } finally {
      // Clean up temp directory
      await rm(tempExtractDir, { recursive: true, force: true });
    }
  }

  /**
   * List all files in a directory recursively
   */
  private async listFiles(dir: string, baseDir?: string): Promise<ResourceFile[]> {
    const base = baseDir || dir;
    const files: ResourceFile[] = [];

    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relativePath = relative(base, fullPath);

      // Prevent Zip Slip by ensuring the relative path doesn't go outside the base directory
      if (relativePath.startsWith('..') || isAbsolute(relativePath)) {
        this.auditLogger.warning('source-parser-zip-slip-attempt', relativePath, 'source-parser', {
          baseDir: base,
          fullPath,
        });
        continue;
      }

      // Skip excluded patterns
      if (this.shouldExclude(relativePath)) {
        continue;
      }

      if (entry.isDirectory()) {
        const subFiles = await this.listFiles(fullPath, base);
        files.push(...subFiles);
      } else if (entry.isFile()) {
        const content = await readFile(fullPath, 'utf-8');
        const stats = await stat(fullPath);
        files.push({
          path: relativePath,
          content,
          mode: stats.mode,
        });
      }
    }

    return files;
  }

  /**
   * Check if a path should be excluded
   */
  private shouldExclude(path: string): boolean {
    const parts = path.split(sep);
    for (const pattern of EXCLUDE_PATTERNS) {
      if (pattern.includes('*')) {
        // Simple wildcard matching
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        if (parts.some((part) => regex.test(part))) {
          return true;
        }
      } else {
        if (parts.includes(pattern)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Get the total size of a directory
   */
  private async getDirectorySize(dir: string): Promise<number> {
    let totalSize = 0;

    try {
      if (!existsSync(dir)) return 0;

      const entries = await readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);

        if (entry.isDirectory()) {
          totalSize += await this.getDirectorySize(fullPath);
        } else if (entry.isFile()) {
          try {
            const stats = await stat(fullPath);
            totalSize += stats.size;
          } catch (error) {
            // Log error but continue
            this.auditLogger.warning('source-parser-size-failed', fullPath, 'source-parser', {
              error: (error as Error).message,
            });
          }
        }
      }
    } catch (error) {
      // Log error but return what we have so far
      this.auditLogger.warning('source-parser-dir-size-failed', dir, 'source-parser', {
        error: (error as Error).message,
      });
    }

    return totalSize;
  }

  /**
   * Ensure a directory exists
   */
  private async ensureDir(dir: string): Promise<void> {
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
  }

  /**
   * Clear the cache directory
   */
  async clearCache(): Promise<void> {
    if (existsSync(this.cacheDir)) {
      await rm(this.cacheDir, { recursive: true, force: true });
    }
  }
}
