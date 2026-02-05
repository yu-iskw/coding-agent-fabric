import { describe, it, expect } from 'vitest';
import {
  parseSource,
  normalizePath,
  isValidSemver,
  compareSemver,
  extractCategories,
  generateSmartName,
  safeJoin,
  isExcludedName,
  LOCK_FILE_VERSION,
  CORE_RESOURCE_TYPES,
  EXCLUDE_PATTERNS,
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

  describe('isExcludedName', () => {
    it('should match exact patterns', () => {
      expect(isExcludedName('node_modules', EXCLUDE_PATTERNS)).toBe(true);
      expect(isExcludedName('.git', EXCLUDE_PATTERNS)).toBe(true);
      expect(isExcludedName('dist', EXCLUDE_PATTERNS)).toBe(true);
      expect(isExcludedName('build', EXCLUDE_PATTERNS)).toBe(true);
      expect(isExcludedName('.DS_Store', EXCLUDE_PATTERNS)).toBe(true);
      expect(isExcludedName('.env', EXCLUDE_PATTERNS)).toBe(true);
    });

    it('should NOT match substrings for exact patterns', () => {
      // .github should NOT be excluded by .git pattern (regression test)
      expect(isExcludedName('.github', EXCLUDE_PATTERNS)).toBe(false);
      // something-dist should NOT be excluded by dist pattern
      expect(isExcludedName('something-dist', EXCLUDE_PATTERNS)).toBe(false);
      // node_modules_backup should NOT be excluded
      expect(isExcludedName('node_modules_backup', EXCLUDE_PATTERNS)).toBe(false);
    });

    it('should match wildcard prefix patterns (*.ext)', () => {
      expect(isExcludedName('error.log', EXCLUDE_PATTERNS)).toBe(true);
      expect(isExcludedName('debug.log', EXCLUDE_PATTERNS)).toBe(true);
      expect(isExcludedName('app.log', EXCLUDE_PATTERNS)).toBe(true);
    });

    it('should match wildcard suffix patterns (prefix.*)', () => {
      expect(isExcludedName('.env.local', EXCLUDE_PATTERNS)).toBe(true);
      expect(isExcludedName('.env.production', EXCLUDE_PATTERNS)).toBe(true);
      expect(isExcludedName('.env.development', EXCLUDE_PATTERNS)).toBe(true);
    });

    it('should NOT match unrelated names', () => {
      expect(isExcludedName('src', EXCLUDE_PATTERNS)).toBe(false);
      expect(isExcludedName('package.json', EXCLUDE_PATTERNS)).toBe(false);
      expect(isExcludedName('SKILL.md', EXCLUDE_PATTERNS)).toBe(false);
      expect(isExcludedName('.claude', EXCLUDE_PATTERNS)).toBe(false);
      expect(isExcludedName('skills', EXCLUDE_PATTERNS)).toBe(false);
    });
  });
});
