import { describe, it, expect } from 'vitest';
import {
  parseSource,
  normalizePath,
  isValidSemver,
  compareSemver,
  extractCategories,
  generateSmartName,
  safeJoin,
  LOCK_FILE_VERSION,
  CORE_RESOURCE_TYPES,
} from './index.js';

describe('@coding-agent-fabric/common', () => {
  describe('parseSource', () => {
    it('should parse GitHub shorthand', () => {
      const result = parseSource('vercel-labs/agent-skills');
      expect(result.type).toBe('github');
      expect(result.owner).toBe('vercel-labs');
      expect(result.repo).toBe('agent-skills');
    });

    it('should parse GitHub URL', () => {
      const result = parseSource('https://github.com/vercel-labs/agent-skills');
      expect(result.type).toBe('github');
      expect(result.owner).toBe('vercel-labs');
      expect(result.repo).toBe('agent-skills');
    });

    it('should parse npm package', () => {
      const result = parseSource('npm:my-package');
      expect(result.type).toBe('npm');
      expect(result.npmPackage).toBe('my-package');
    });

    it('should parse local path', () => {
      const result = parseSource('./my-local-path');
      expect(result.type).toBe('local');
      expect(result.localPath).toBe('./my-local-path');
    });
  });

  describe('normalizePath', () => {
    it('should remove trailing slashes', () => {
      expect(normalizePath('/path/to/dir/')).toBe('/path/to/dir');
    });
  });

  describe('semver utilities', () => {
    it('should validate semver versions', () => {
      expect(isValidSemver('1.0.0')).toBe(true);
      expect(isValidSemver('v1.0.0')).toBe(true);
      expect(isValidSemver('1.0.0-alpha')).toBe(true);
      expect(isValidSemver('invalid')).toBe(false);
    });

    it('should compare semver versions', () => {
      expect(compareSemver('1.0.0', '2.0.0')).toBe(-1);
      expect(compareSemver('2.0.0', '1.0.0')).toBe(1);
      expect(compareSemver('1.0.0', '1.0.0')).toBe(0);
    });
  });

  describe('category utilities', () => {
    it('should extract categories from path', () => {
      const categories = extractCategories('skills/frontend/react/patterns');
      expect(categories).toEqual(['frontend', 'react']);
    });

    it('should generate smart name', () => {
      const name = generateSmartName('patterns', ['frontend', 'react']);
      expect(name).toBe('frontend-react-patterns');
    });
  });

  describe('path utilities', () => {
    describe('safeJoin', () => {
      it('should join safe paths', () => {
        const base = '/tmp/base';
        expect(safeJoin(base, 'file.txt')).toContain('/tmp/base/file.txt');
        expect(safeJoin(base, 'subdir', 'file.txt')).toContain('/tmp/base/subdir/file.txt');
      });

      it('should throw on path traversal with ..', () => {
        const base = '/tmp/base';
        expect(() => safeJoin(base, '../outside.txt')).toThrow('Path traversal detected');
        expect(() => safeJoin(base, 'subdir', '../../outside.txt')).toThrow(
          'Path traversal detected',
        );
      });

      it('should throw on absolute paths', () => {
        const base = '/tmp/base';
        expect(() => safeJoin(base, '/etc/passwd')).toThrow('Path traversal detected');
      });
    });
  });

  describe('constants', () => {
    it('should have correct lock file version', () => {
      expect(LOCK_FILE_VERSION).toBe(2);
    });

    it('should have correct core resource types', () => {
      expect(CORE_RESOURCE_TYPES).toEqual(['skills', 'subagents', 'rules']);
    });
  });
});
