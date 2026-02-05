/**
 * Tests for AgentRegistry
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AgentRegistry } from './agent-registry.js';

describe('AgentRegistry', () => {
  let registry: AgentRegistry;

  beforeEach(() => {
    registry = new AgentRegistry('/test/project');
  });

  describe('default agents', () => {
    it('should register default agents on initialization', () => {
      expect(registry.has('claude-code')).toBe(true);
      expect(registry.has('cursor')).toBe(true);
      expect(registry.has('codex')).toBe(true);
      expect(registry.has('windsurf')).toBe(true);
      expect(registry.has('aider')).toBe(true);
      expect(registry.has('continue')).toBe(true);
    });

    it('should get Claude Code configuration', () => {
      const config = registry.get('claude-code');

      expect(config).toBeDefined();
      expect(config?.name).toBe('claude-code');
      expect(config?.displayName).toBe('Claude Code');
      expect(config?.skillsDir).toContain('.claude/skills');
    });

    it('should get Cursor configuration', () => {
      const config = registry.get('cursor');

      expect(config).toBeDefined();
      expect(config?.name).toBe('cursor');
      expect(config?.displayName).toBe('Cursor');
      expect(config?.skillsDir).toContain('.cursor/fabric-skills');
    });
  });

  describe('registration', () => {
    it('should register a custom agent', () => {
      registry.register({
        name: 'custom-agent',
        displayName: 'Custom Agent',
        skillsDir: '/custom/skills',
        detectInstalled: async () => false,
      });

      expect(registry.has('custom-agent')).toBe(true);
    });

    it('should override existing agent configuration', () => {
      const originalConfig = registry.get('claude-code');

      registry.register({
        name: 'claude-code',
        displayName: 'Custom Claude Code',
        skillsDir: '/custom/skills',
        detectInstalled: async () => false,
      });

      const newConfig = registry.get('claude-code');
      expect(newConfig?.displayName).toBe('Custom Claude Code');
      expect(newConfig?.displayName).not.toBe(originalConfig?.displayName);
    });
  });

  describe('querying', () => {
    it('should get all agents', () => {
      const all = registry.getAll();

      expect(all.length).toBeGreaterThan(0);
      expect(all.some((agent) => agent.name === 'claude-code')).toBe(true);
    });

    it('should get all agent names', () => {
      const names = registry.getAllNames();

      expect(names.length).toBeGreaterThan(0);
      expect(names).toContain('claude-code');
      expect(names).toContain('cursor');
    });

    it('should return undefined for unknown agent', () => {
      const config = registry.get('unknown-agent' as string);
      expect(config).toBeUndefined();
    });
  });

  describe('directory helpers', () => {
    it('should get skills directory for an agent', () => {
      const skillsDir = registry.getSkillsDir('claude-code');
      expect(skillsDir).toContain('.claude/skills');
    });

    it('should get global skills directory for an agent', () => {
      const globalSkillsDir = registry.getSkillsDir('claude-code', true);
      expect(globalSkillsDir).toContain('.claude/skills');
    });

    it('should get hooks directory for an agent', () => {
      const hooksDir = registry.getHooksDir('claude-code');
      expect(hooksDir).toContain('.claude/hooks');
    });

    it('should get subagents directory for an agent', () => {
      const subagentsDir = registry.getSubagentsDir('claude-code');
      expect(subagentsDir).toContain('.claude/agents');
    });

    it('should get MCP config file for an agent', () => {
      const mcpConfigFile = registry.getMcpConfigFile('claude-code');
      expect(mcpConfigFile).toContain('.claude/mcp.json');
    });

    it('should return undefined for unknown agent', () => {
      const skillsDir = registry.getSkillsDir('unknown-agent' as string);
      expect(skillsDir).toBeUndefined();
    });
  });

  describe('resource directory helper', () => {
    it('should get resource directory for skills', () => {
      const dir = registry.getResourceDir('claude-code', 'skills');
      expect(dir).toContain('.claude/skills');
    });

    it('should get resource directory for hooks', () => {
      const dir = registry.getResourceDir('claude-code', 'hooks');
      expect(dir).toContain('.claude/hooks');
    });

    it('should get resource directory for subagents', () => {
      const dir = registry.getResourceDir('claude-code', 'subagents');
      expect(dir).toContain('.claude/agents');
    });

    it('should get resource directory for mcp', () => {
      const dir = registry.getResourceDir('claude-code', 'mcp');
      expect(dir).toContain('.claude/mcp.json');
    });

    it('should return undefined for unknown resource type', () => {
      const dir = registry.getResourceDir('claude-code', 'unknown');
      expect(dir).toBeUndefined();
    });
  });
});
