/**
 * Tests for SkillsHandler
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { SkillsHandler } from './skills-handler.js';
import { AgentRegistry } from './agent-registry.js';
import { LockManager } from './lock-manager.js';
import type { ParsedSource, Resource } from '@coding-agent-fabric/common';

describe('SkillsHandler', () => {
  let handler: SkillsHandler;
  let agentRegistry: AgentRegistry;
  let lockManager: LockManager;
  let testDir: string;
  let projectRoot: string;

  beforeEach(async () => {
    // Create temporary test directory with unique name to avoid race conditions
    testDir = join(
      tmpdir(),
      `skills-handler-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    projectRoot = join(testDir, 'project');
    await mkdir(projectRoot, { recursive: true });

    // Initialize components
    agentRegistry = new AgentRegistry(projectRoot);
    lockManager = new LockManager({ projectRoot });
    handler = new SkillsHandler({
      agentRegistry,
      lockManager,
      projectRoot,
    });
  });

  afterEach(async () => {
    // Clean up
    await rm(testDir, { recursive: true, force: true });
  });

  describe('discover', () => {
    it('should discover skills from local source', async () => {
      // Create test skill structure
      const skillsDir = join(testDir, 'skills');
      const skillPath = join(skillsDir, 'test-skill');
      await mkdir(skillPath, { recursive: true });

      const skillContent = `---
name: test-skill
version: 1.0.0
description: A test skill
---

# Test Skill

This is a test skill.
`;

      await writeFile(join(skillPath, 'SKILL.md'), skillContent);

      const source: ParsedSource = {
        type: 'local',
        url: `file://${skillsDir}`,
        localPath: skillsDir,
      };

      const resources = await handler.discover(source);

      expect(resources).toHaveLength(1);
      expect(resources[0].name).toBe('test-skill');
      expect(resources[0].version).toBe('1.0.0');
      expect(resources[0].description).toBe('A test skill');
    });

    it('should discover nested skills', async () => {
      // Create nested skill structure
      const skillsDir = join(testDir, 'skills');
      const categoryPath = join(skillsDir, 'category1', 'category2');
      const skillPath = join(categoryPath, 'nested-skill');
      await mkdir(skillPath, { recursive: true });

      await writeFile(join(skillPath, 'SKILL.md'), '# Nested Skill\n\nA nested skill.');

      const source: ParsedSource = {
        type: 'local',
        url: `file://${skillsDir}`,
        localPath: skillsDir,
      };

      const resources = await handler.discover(source);

      expect(resources).toHaveLength(1);
      expect(resources[0].metadata.categories).toEqual(['category1', 'category2']);
    });

    it('should extract metadata from SKILL.md', async () => {
      const skillsDir = join(testDir, 'skills');
      const skillPath = join(skillsDir, 'metadata-skill');
      await mkdir(skillPath, { recursive: true });

      const skillContent = `---
name: custom-name
version: 2.1.0
description: Custom description
---

# Title

Content here.
`;

      await writeFile(join(skillPath, 'SKILL.md'), skillContent);

      const source: ParsedSource = {
        type: 'local',
        url: `file://${skillsDir}`,
        localPath: skillsDir,
      };

      const resources = await handler.discover(source);

      expect(resources).toHaveLength(1);
      expect(resources[0].name).toBe('custom-name');
      expect(resources[0].version).toBe('2.1.0');
      expect(resources[0].description).toBe('Custom description');
    });
  });

  describe('validate', () => {
    it('should validate a valid skill', async () => {
      const resource: Resource = {
        type: 'skills',
        name: 'test-skill',
        description: 'A test skill',
        metadata: {},
        files: [
          {
            path: 'SKILL.md',
            content: '# Test Skill',
          },
        ],
      };

      const result = await handler.validate(resource);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject skill without name', async () => {
      const resource: Resource = {
        type: 'skills',
        name: '',
        description: 'A test skill',
        metadata: {},
        files: [
          {
            path: 'SKILL.md',
            content: '# Test Skill',
          },
        ],
      };

      const result = await handler.validate(resource);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Skill name is required');
    });

    it('should reject skill without files', async () => {
      const resource: Resource = {
        type: 'skills',
        name: 'test-skill',
        description: 'A test skill',
        metadata: {},
        files: [],
      };

      const result = await handler.validate(resource);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Skill must have at least one file');
    });

    it('should warn if no description', async () => {
      const resource: Resource = {
        type: 'skills',
        name: 'test-skill',
        description: '',
        metadata: {},
        files: [
          {
            path: 'SKILL.md',
            content: '# Test Skill',
          },
        ],
      };

      const result = await handler.validate(resource);

      expect(result.warnings).toContain('Skill description is missing');
    });
  });

  describe('getSupportedAgents', () => {
    it('should return list of supported agents', () => {
      const agents = handler.getSupportedAgents();

      expect(agents).toContain('claude-code');
      expect(agents).toContain('cursor');
      expect(agents.length).toBeGreaterThan(0);
    });
  });

  describe('getInstallPath', () => {
    it('should return project install path', () => {
      const path = handler.getInstallPath('claude-code', 'project');

      expect(path).toContain(projectRoot);
      expect(path).toContain('.claude/skills');
    });

    it('should return global install path', () => {
      const path = handler.getInstallPath('claude-code', 'global');

      expect(path).toContain('.claude/skills');
    });

    it('should throw for unknown agent', () => {
      expect(() => {
        handler.getInstallPath('unknown-agent' as string, 'project');
      }).toThrow('Agent unknown-agent not found');
    });
  });
});
