/**
 * Tests for SubagentsHandler
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync } from 'node:fs';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { SubagentsHandler } from './subagents-handler.js';
import { AgentRegistry } from './agent-registry.js';
import type { ParsedSource, Resource } from '@coding-agent-fabric/common';

describe('SubagentsHandler', () => {
  let handler: SubagentsHandler;
  let agentRegistry: AgentRegistry;
  let testDir: string;
  let projectRoot: string;

  beforeEach(async () => {
    // Create temporary test directory with unique name to avoid race conditions
    testDir = join(
      tmpdir(),
      `subagents-handler-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    projectRoot = join(testDir, 'project');
    await mkdir(projectRoot, { recursive: true });

    // Initialize components
    agentRegistry = new AgentRegistry(projectRoot);
    handler = new SubagentsHandler({
      agentRegistry,
      projectRoot,
    });
  });

  afterEach(async () => {
    // Clean up
    await rm(testDir, { recursive: true, force: true });
  });

  describe('discover', () => {
    it('should discover subagents from local JSON source', async () => {
      // Create test subagent structure
      const subagentsDir = join(testDir, 'subagents');
      const subagentPath = join(subagentsDir, 'test-agent');
      await mkdir(subagentPath, { recursive: true });

      const subagentConfig = {
        name: 'test-agent',
        version: '1.0.0',
        description: 'A test subagent',
        model: 'claude-sonnet-4',
        instructions: 'Test instructions',
      };

      await writeFile(join(subagentPath, 'subagent.json'), JSON.stringify(subagentConfig, null, 2));

      const source: ParsedSource = {
        type: 'local',
        url: `file://${subagentsDir}`,
        localPath: subagentsDir,
      };

      const resources = await handler.discover(source);

      expect(resources).toHaveLength(1);
      expect(resources[0].name).toBe('test-agent');
      expect(resources[0].version).toBe('1.0.0');
      expect(resources[0].description).toBe('A test subagent');
      expect(resources[0].metadata.model).toBe('claude-sonnet-4');
      expect(resources[0].metadata.format).toBe('coding-agent-fabric-json');
    });

    it('should discover subagents from local path directly', async () => {
      // Create test subagent structure
      const subagentsDir = join(testDir, 'subagents-path');
      const subagentPath = join(subagentsDir, 'test-agent-path');
      await mkdir(subagentPath, { recursive: true });

      const subagentConfig = {
        name: 'test-agent-path',
        description: 'A test subagent from path',
      };

      await writeFile(join(subagentPath, 'subagent.json'), JSON.stringify(subagentConfig));

      const resources = await handler.discoverFromPath(subagentsDir);

      expect(resources).toHaveLength(1);
      expect(resources[0].name).toBe('test-agent-path');
    });

    it('should discover subagents from YAML source', async () => {
      const subagentsDir = join(testDir, 'subagents');
      const subagentPath = join(subagentsDir, 'yaml-agent');
      await mkdir(subagentPath, { recursive: true });

      const yamlContent = `name: yaml-agent
description: A YAML subagent
model: claude-opus-4
instructions: YAML instructions
`;

      await writeFile(join(subagentPath, 'subagent.yaml'), yamlContent);

      const source: ParsedSource = {
        type: 'local',
        url: `file://${subagentsDir}`,
        localPath: subagentsDir,
      };

      const resources = await handler.discover(source);

      expect(resources).toHaveLength(1);
      expect(resources[0].name).toBe('yaml-agent');
      expect(resources[0].metadata.format).toBe('claude-code-yaml');
    });
  });

  describe('validate', () => {
    it('should validate a valid subagent', async () => {
      const resource: Resource = {
        type: 'subagents',
        name: 'test-agent',
        description: 'A test subagent',
        metadata: {
          format: 'coding-agent-fabric-json',
        },
        files: [
          {
            path: 'subagent.json',
            content: JSON.stringify({ name: 'test-agent' }),
          },
        ],
      };

      const result = await handler.validate(resource);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject subagent without name', async () => {
      const resource: Resource = {
        type: 'subagents',
        name: '',
        description: 'A test subagent',
        metadata: {},
        files: [
          {
            path: 'subagent.json',
            content: '{}',
          },
        ],
      };

      const result = await handler.validate(resource);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Subagent name is required');
    });

    it('should reject subagent without files', async () => {
      const resource: Resource = {
        type: 'subagents',
        name: 'test-agent',
        description: 'A test subagent',
        metadata: {},
        files: [],
      };

      const result = await handler.validate(resource);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Subagent must have at least one file');
    });

    it('should warn if no description', async () => {
      const resource: Resource = {
        type: 'subagents',
        name: 'test-agent',
        description: '',
        metadata: { format: 'coding-agent-fabric-json' },
        files: [
          {
            path: 'subagent.json',
            content: '{}',
          },
        ],
      };

      const result = await handler.validate(resource);

      expect(result.warnings).toContain('Subagent description is missing');
    });
  });

  describe('getSupportedAgents', () => {
    it('should return list of agents that support subagents', () => {
      const agents = handler.getSupportedAgents();

      // Should include agents with subagentsDir
      expect(agents).toContain('claude-code');
      expect(agents.length).toBeGreaterThan(0);
    });
  });

  describe('getInstallPath', () => {
    it('should return project install path', () => {
      const path = handler.getInstallPath('claude-code', 'project');

      expect(path).toContain(projectRoot);
      expect(path).toContain('.claude/agents');
    });

    it('should return global install path', () => {
      const path = handler.getInstallPath('claude-code', 'global');

      expect(path).toContain('.claude/agents');
    });

    it('should throw for unknown agent', () => {
      expect(() => {
        handler.getInstallPath('unknown-agent' as string, 'project');
      }).toThrow('Agent unknown-agent not found');
    });

    it('should throw for agent without subagent support', () => {
      // Register a custom agent without subagent support
      agentRegistry.register({
        name: 'no-subagents',
        displayName: 'No Subagents',
        skillsDir: '.skills',
        detectInstalled: async () => false,
      });

      expect(() => {
        handler.getInstallPath('no-subagents', 'project');
      }).toThrow('does not support subagents');
    });
  });

  describe('install', () => {
    it('should install subagent with multiple files into a subdirectory', async () => {
      const resource: Resource = {
        type: 'subagents',
        name: 'multi-file-agent',
        description: 'A test subagent with multiple files',
        metadata: {
          format: 'coding-agent-fabric-json',
        },
        files: [
          {
            path: 'subagent.json',
            content: JSON.stringify({ name: 'multi-file-agent', description: 'desc' }),
          },
          {
            path: 'instructions.md',
            content: 'Detailed instructions',
          },
          {
            path: 'tools/custom-tool.js',
            content: 'module.exports = {}',
          },
        ],
      };

      const targets = [{ agent: 'claude-code' as const, scope: 'project' as const }];
      const options = { force: true };

      await handler.install(resource, targets, options);

      const installPath = handler.getInstallPath('claude-code', 'project');
      const yamlPath = join(installPath, 'multi-file-agent.yaml');
      const subagentDir = join(installPath, 'multi-file-agent');

      // Check YAML file exists and is converted
      expect(existsSync(yamlPath)).toBe(true);

      // Check subdirectory exists
      expect(existsSync(subagentDir)).toBe(true);

      // Check support files exist in subdirectory
      expect(existsSync(join(subagentDir, 'instructions.md'))).toBe(true);
      expect(existsSync(join(subagentDir, 'custom-tool.js'))).toBe(true);
    });
  });
});
