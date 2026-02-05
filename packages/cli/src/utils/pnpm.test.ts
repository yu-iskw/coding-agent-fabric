import { describe, it, expect } from 'vitest';
import { inferPackageName, normalizePackageSpecifier } from './pnpm.js';

describe('pnpm utils', () => {
  describe('normalizePackageSpecifier', () => {
    it('normalizes scoped packages with versions', () => {
      expect(normalizePackageSpecifier('@scope/pkg@1.2.3')).toBe('@scope/pkg');
      expect(normalizePackageSpecifier('@scope/pkg')).toBe('@scope/pkg');
    });

    it('normalizes unscoped packages with versions', () => {
      expect(normalizePackageSpecifier('pkg@4.1.0')).toBe('pkg');
      expect(normalizePackageSpecifier('pkg')).toBe('pkg');
    });

    it('normalizes npm protocol specifiers', () => {
      expect(normalizePackageSpecifier('npm:@scope/pkg@1.2.3')).toBe('@scope/pkg');
      expect(normalizePackageSpecifier('npm:pkg@next')).toBe('pkg');
    });
  });

  describe('inferPackageName', () => {
    it('uses normalized scoped package names in fast path', () => {
      const result = inferPackageName('@scope/pkg@1.2.3', {});
      expect(result).toBe('@scope/pkg');
    });

    it('falls back to dependency matching for non-package sources', () => {
      const result = inferPackageName('owner/repo', {
        devDependencies: {
          'test-package': 'github:owner/repo',
        },
      });
      expect(result).toBe('test-package');
    });

    it('returns null when fallback cannot resolve a package', () => {
      const result = inferPackageName('owner/repo', {
        devDependencies: {
          'another-package': '^1.0.0',
        },
      });
      expect(result).toBeNull();
    });
  });
});
