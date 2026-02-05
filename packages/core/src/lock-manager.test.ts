/**
 * Tests for LockManager
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync } from 'node:fs';
import { rm, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { LockManager } from './lock-manager.js';
import type { SkillLockEntry, ResourceLockEntry } from '@coding-agent-fabric/common';

describe('LockManager', () => {
  let testDir: string;
  let lockManager: LockManager;

  beforeEach(async () => {
    // Create a temporary test directory with unique name to avoid race conditions
    testDir = join(
      tmpdir(),
      `lock-manager-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    await mkdir(testDir, { recursive: true });
    lockManager = new LockManager({ projectRoot: testDir });
  });

  afterEach(async () => {
    // Clean up test directory
    if (existsSync(testDir)) {
      await rm(testDir, { recursive: true, force: true });
    }
  });

  describe('initialize', () => {
    it('should create a new lock file with default configuration', async () => {
      const lockFile = await lockManager.initialize();

      expect(lockFile.version).toBe(2);
      expect(lockFile.config.defaultScope).toBe('project');
      expect(lockFile.config.updateStrategy).toBe('parallel');
      expect(lockFile.plugins).toEqual({});
      expect(lockFile.resources).toEqual({});
    });

    it('should create lock file with custom configuration', async () => {
      const lockFile = await lockManager.initialize({
        preferredAgents: ['claude-code', 'cursor'],
        defaultScope: 'global',
      });

      expect(lockFile.config.preferredAgents).toEqual(['claude-code', 'cursor']);
      expect(lockFile.config.defaultScope).toBe('global');
    });

    it('should save lock file to disk', async () => {
      await lockManager.initialize();
      expect(lockManager.exists()).toBe(true);
    });
  });

  describe('load', () => {
    it('should load existing lock file', async () => {
      await lockManager.initialize();
      const loaded = await lockManager.load();

      expect(loaded.version).toBe(2);
      expect(loaded.config).toBeDefined();
    });

    it('should create new lock file if it does not exist', async () => {
      const loaded = await lockManager.load();

      expect(loaded.version).toBe(2);
      expect(lockManager.exists()).toBe(true);
    });
  });

  describe('resource management', () => {
    beforeEach(async () => {
      await lockManager.initialize();
    });

    it('should add a resource entry', async () => {
      const entry: SkillLockEntry = {
        type: 'skills',
        handler: 'built-in',
        name: 'test-skill',
        version: '1.0.0',
        source: 'owner/repo',
        sourceType: 'github',
        sourceUrl: 'https://github.com/owner/repo',
        installedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        installedFor: [
          {
            agent: 'claude-code',
            scope: 'project',
            path: '.claude/skills/test-skill',
          },
        ],
        originalName: 'test-skill',
        installedName: 'test-skill',
        sourcePath: 'skills/test-skill',
        categories: [],
      };

      await lockManager.addResource(entry);

      const retrieved = await lockManager.getResource('test-skill');
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('test-skill');
    });

    it('should remove a resource entry', async () => {
      const entry: SkillLockEntry = {
        type: 'skills',
        handler: 'built-in',
        name: 'test-skill',
        version: '1.0.0',
        source: 'owner/repo',
        sourceType: 'github',
        sourceUrl: 'https://github.com/owner/repo',
        installedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        installedFor: [],
        originalName: 'test-skill',
        installedName: 'test-skill',
        sourcePath: 'skills/test-skill',
        categories: [],
      };

      await lockManager.addResource(entry);
      await lockManager.removeResource('test-skill');

      const retrieved = await lockManager.getResource('test-skill');
      expect(retrieved).toBeUndefined();
    });

    it('should get all resources', async () => {
      const entry1: SkillLockEntry = {
        type: 'skills',
        handler: 'built-in',
        name: 'skill-1',
        version: '1.0.0',
        source: 'owner/repo',
        sourceType: 'github',
        sourceUrl: 'https://github.com/owner/repo',
        installedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        installedFor: [],
        originalName: 'skill-1',
        installedName: 'skill-1',
        sourcePath: 'skills/skill-1',
        categories: [],
      };

      const entry2: SkillLockEntry = {
        type: 'skills',
        handler: 'built-in',
        name: 'skill-2',
        version: '1.0.0',
        source: 'owner/repo',
        sourceType: 'github',
        sourceUrl: 'https://github.com/owner/repo',
        installedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        installedFor: [],
        originalName: 'skill-2',
        installedName: 'skill-2',
        sourcePath: 'skills/skill-2',
        categories: [],
      };

      await lockManager.addResource(entry1);
      await lockManager.addResource(entry2);

      const all = await lockManager.getAllResources();
      expect(Object.keys(all)).toHaveLength(2);
      expect(all['skill-1']).toBeDefined();
      expect(all['skill-2']).toBeDefined();
    });

    it('should get resources by type', async () => {
      const skillEntry: SkillLockEntry = {
        type: 'skills',
        handler: 'built-in',
        name: 'test-skill',
        version: '1.0.0',
        source: 'owner/repo',
        sourceType: 'github',
        sourceUrl: 'https://github.com/owner/repo',
        installedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        installedFor: [],
        originalName: 'test-skill',
        installedName: 'test-skill',
        sourcePath: 'skills/test-skill',
        categories: [],
      };

      await lockManager.addResource(skillEntry);

      const skills = await lockManager.getResourcesByType('skills');
      expect(skills).toHaveLength(1);
      expect(skills[0]?.name).toBe('test-skill');
    });

    it('should get resources for a specific agent', async () => {
      const entry: SkillLockEntry = {
        type: 'skills',
        handler: 'built-in',
        name: 'test-skill',
        version: '1.0.0',
        source: 'owner/repo',
        sourceType: 'github',
        sourceUrl: 'https://github.com/owner/repo',
        installedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        installedFor: [
          {
            agent: 'claude-code',
            scope: 'project',
            path: '.claude/skills/test-skill',
          },
        ],
        originalName: 'test-skill',
        installedName: 'test-skill',
        sourcePath: 'skills/test-skill',
        categories: [],
      };

      await lockManager.addResource(entry);

      const claudeCodeResources = await lockManager.getResourcesForAgent('claude-code');
      expect(claudeCodeResources).toHaveLength(1);
      expect(claudeCodeResources[0]?.name).toBe('test-skill');
    });

    it('should track history when updating a resource', async () => {
      const entry1 = {
        type: 'skills',
        handler: 'built-in',
        name: 'test-skill',
        version: '1.0.0',
        sourceUrl: 'url1',
        updatedAt: '2026-01-01',
        installedFor: [],
      } as unknown as ResourceLockEntry;
      await lockManager.addResource(entry1);

      const entry2 = {
        ...entry1,
        version: '1.1.0',
        sourceUrl: 'url2',
        updatedAt: '2026-02-01',
      } as unknown as ResourceLockEntry;
      await lockManager.addResource(entry2);

      const resource = await lockManager.getResource('test-skill');
      expect(resource?.version).toBe('1.1.0');
      expect(resource?.history?.length).toBe(1);
      expect(resource?.history?.[0]?.version).toBe('1.0.0');
    });

    it('should rollback to previous version', async () => {
      const entry1 = {
        type: 'skills',
        handler: 'built-in',
        name: 'rollback-skill',
        version: '1.0.0',
        sourceUrl: 'url1',
        updatedAt: '2026-01-01',
        installedFor: [],
      } as unknown as ResourceLockEntry;
      await lockManager.addResource(entry1);

      const entry2 = {
        ...entry1,
        version: '1.1.0',
        sourceUrl: 'url2',
        updatedAt: '2026-02-01',
      } as unknown as ResourceLockEntry;
      await lockManager.addResource(entry2);

      const rolledBack = await lockManager.rollbackResource('rollback-skill');
      expect(rolledBack.version).toBe('1.0.0');
      expect(rolledBack.sourceUrl).toBe('url1');
      expect(rolledBack.history?.length).toBe(0);

      const current = await lockManager.getResource('rollback-skill');
      expect(current?.version).toBe('1.0.0');
    });

    it('should respect history limit', async () => {
      await lockManager.updateConfig({ historyLimit: 2 });

      const name = 'limit-skill';
      for (let i = 1; i <= 5; i++) {
        await lockManager.addResource({
          type: 'skills',
          handler: 'built-in',
          name,
          version: `${i}.0.0`,
          updatedAt: `2026-0${i}-01`,
          sourceUrl: `url${i}`,
          installedFor: [],
        } as unknown as ResourceLockEntry);
      }

      const resource = await lockManager.getResource(name);
      expect(resource?.history?.length).toBe(2);
      expect(resource?.history?.[0]?.version).toBe('4.0.0');
      expect(resource?.history?.[1]?.version).toBe('3.0.0');
    });
  });

  describe('plugin management', () => {
    beforeEach(async () => {
      await lockManager.initialize();
    });

    it('should add a plugin entry', async () => {
      await lockManager.addPlugin('test-plugin', {
        version: '1.0.0',
        installedAt: new Date().toISOString(),
        enabled: true,
        location: 'project',
      });

      const plugin = await lockManager.getPlugin('test-plugin');
      expect(plugin).toBeDefined();
      expect(plugin?.version).toBe('1.0.0');
    });

    it('should remove a plugin entry', async () => {
      await lockManager.addPlugin('test-plugin', {
        version: '1.0.0',
        installedAt: new Date().toISOString(),
        enabled: true,
        location: 'project',
      });

      await lockManager.removePlugin('test-plugin');

      const plugin = await lockManager.getPlugin('test-plugin');
      expect(plugin).toBeUndefined();
    });

    it('should get all plugins', async () => {
      await lockManager.addPlugin('plugin-1', {
        version: '1.0.0',
        installedAt: new Date().toISOString(),
        enabled: true,
        location: 'project',
      });

      await lockManager.addPlugin('plugin-2', {
        version: '2.0.0',
        installedAt: new Date().toISOString(),
        enabled: false,
        location: 'global',
      });

      const plugins = await lockManager.getAllPlugins();
      expect(Object.keys(plugins)).toHaveLength(2);
      expect(plugins['plugin-1']?.version).toBe('1.0.0');
      expect(plugins['plugin-2']?.version).toBe('2.0.0');
    });
  });

  describe('configuration', () => {
    beforeEach(async () => {
      await lockManager.initialize();
    });

    it('should update configuration', async () => {
      await lockManager.updateConfig({
        preferredAgents: ['claude-code'],
        defaultScope: 'global',
      });

      const config = await lockManager.getConfig();
      expect(config.preferredAgents).toEqual(['claude-code']);
      expect(config.defaultScope).toBe('global');
    });

    it('should get configuration', async () => {
      const config = await lockManager.getConfig();
      expect(config).toBeDefined();
      expect(config.defaultScope).toBe('project');
      expect(config.updateStrategy).toBe('parallel');
    });
  });
});
