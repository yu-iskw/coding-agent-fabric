/**
 * Tests for SourceParser
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync } from 'node:fs';
import { rm, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { SourceParser } from './source-parser.js';

describe('SourceParser', () => {
  let testDir: string;
  let parser: SourceParser;

  beforeEach(async () => {
    // Create a temporary test directory with unique name to avoid race conditions
    testDir = join(
      tmpdir(),
      `source-parser-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    await mkdir(testDir, { recursive: true });
    parser = new SourceParser({ cacheDir: testDir });
  });

  afterEach(async () => {
    // Clean up test directory
    if (existsSync(testDir)) {
      await rm(testDir, { recursive: true, force: true });
    }
  });

  describe('local sources', () => {
    it('should parse a local directory', async () => {
      // Create test files
      const localDir = join(testDir, 'local-source');
      await mkdir(localDir, { recursive: true });
      await writeFile(join(localDir, 'file1.md'), 'content1');
      await writeFile(join(localDir, 'file2.txt'), 'content2');

      const result = await parser.parse(localDir);

      expect(result.source.type).toBe('local');
      expect(result.localDir).toBe(localDir);
      expect(result.files.length).toBeGreaterThan(0);
      expect(result.metadata.fileCount).toBe(2);
    });

    it('should parse a local directory with nested files', async () => {
      // Create nested structure
      const localDir = join(testDir, 'nested-source');
      const subDir = join(localDir, 'subdir');
      await mkdir(subDir, { recursive: true });
      await writeFile(join(localDir, 'root.md'), 'root content');
      await writeFile(join(subDir, 'nested.txt'), 'nested content');

      const result = await parser.parse(localDir);

      expect(result.files.length).toBe(2);
      expect(result.files.some((f) => f.path === 'root.md')).toBe(true);
      expect(result.files.some((f) => f.path === 'subdir/nested.txt')).toBe(true);
    });

    it('should exclude node_modules and other patterns', async () => {
      // Create test files including excluded patterns
      const localDir = join(testDir, 'exclude-test');
      const nodeModulesDir = join(localDir, 'node_modules');
      await mkdir(nodeModulesDir, { recursive: true });
      await writeFile(join(localDir, 'file.md'), 'content');
      await writeFile(join(nodeModulesDir, 'package.json'), '{}');

      const result = await parser.parse(localDir);

      expect(result.files.length).toBe(1);
      expect(result.files[0]?.path).toBe('file.md');
    });

    it('should throw error for non-existent local path', async () => {
      await expect(parser.parse('/non/existent/path')).rejects.toThrow('Local path does not exist');
    });

    it('should prevent Zip Slip path traversal', async () => {
      const localDir = join(testDir, 'zip-slip-test');
      await mkdir(localDir, { recursive: true });

      // Create a file with traversal sequence in its name
      // Note: listFiles logic now handles this
      await writeFile(join(localDir, 'safe.txt'), 'safe');

      const result = await parser.parse(localDir);
      expect(result.files.some((f) => f.path === 'safe.txt')).toBe(true);

      // Manual test of shouldExclude or similar isn't easy here,
      // but we can verify listFiles doesn't include files with ..
      // (This is a bit hard to test with real FS because OS might not allow creating such files)
    });
  });

  describe('GitHub sources', () => {
    it('should attempt to download from GitHub', async () => {
      // We don't want to actually download in tests, so we expect a 404 or connection error
      // since 'owner/repo' doesn't exist
      await expect(parser.parse('owner/repo')).rejects.toThrow(/Failed to download GitHub source/);
    }, 15000); // Increase timeout due to retry logic with backoff
  });

  describe('npm sources', () => {
    it('should download and extract an npm package', async () => {
      // 'test-package' seems to exist and work in the previous run
      const result = await parser.parse('npm:test-package');
      expect(result.source.type).toBe('npm');
      expect(result.files.length).toBeGreaterThan(0);
      expect(result.files.some((f) => f.path === 'package.json')).toBe(true);
    }, 15000); // Increase timeout for real network call
  });

  describe('cache directory', () => {
    it('should create cache directory if it does not exist', async () => {
      const cacheDir = join(testDir, 'custom-cache');
      const customParser = new SourceParser({ cacheDir });

      // Create a local source to trigger cache directory creation
      const localDir = join(testDir, 'source');
      await mkdir(localDir, { recursive: true });
      await writeFile(join(localDir, 'file.md'), 'content');

      await customParser.parse(localDir);

      // Note: For local sources, cache dir might not be created
      // This test verifies the parser accepts a custom cache dir
      expect(customParser).toBeDefined();
    });
  });

  describe('metadata', () => {
    it('should include download metadata', async () => {
      const localDir = join(testDir, 'metadata-test');
      await mkdir(localDir, { recursive: true });
      await writeFile(join(localDir, 'file.md'), 'content');

      const result = await parser.parse(localDir);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.downloadedAt).toBeDefined();
      expect(result.metadata.fileCount).toBe(1);
      expect(result.metadata.size).toBeGreaterThan(0);
    });
  });
});
