import { describe, it, expect, beforeEach } from 'vitest';
import { join, sep } from 'node:path';
import { homedir } from 'node:os';
import { AuditLogger } from './audit-logger.js';

describe('AuditLogger', () => {
  let logger: AuditLogger;
  const projectRoot = join(sep, 'users', 'test', 'project');
  const globalRoot = join(sep, 'usr', 'local', 'lib', 'fabric');
  const home = homedir();

  beforeEach(() => {
    logger = new AuditLogger({
      projectRoot,
      globalRoot,
      logToConsole: false, // Don't spam console during tests
    });
  });

  describe('sanitizePath', () => {
    it('should sanitize project root paths', () => {
      const fullPath = join(projectRoot, 'skills', 'test-skill');
      // @ts-expect-error - accessing private method for testing
      const sanitized = logger.sanitizePath(fullPath);
      expect(sanitized).toBe(join('<PROJECT_ROOT>', 'skills', 'test-skill'));
    });

    it('should sanitize global root paths', () => {
      const fullPath = join(globalRoot, 'skills', 'common-skill');
      // @ts-expect-error - accessing private method for testing
      const sanitized = logger.sanitizePath(fullPath);
      expect(sanitized).toBe(join('<GLOBAL_ROOT>', 'skills', 'common-skill'));
    });

    it('should sanitize home directory paths', () => {
      const fullPath = join(home, '.claude', 'hooks', 'hook.json');
      // @ts-expect-error - accessing private method for testing
      const sanitized = logger.sanitizePath(fullPath);
      expect(sanitized).toBe(join('<HOME>', '.claude', 'hooks', 'hook.json'));
    });

    it('should leave relative paths alone', () => {
      const relativePath = join('relative', 'path');
      // @ts-expect-error - accessing private method for testing
      const sanitized = logger.sanitizePath(relativePath);
      expect(sanitized).toBe(relativePath);
    });
  });

  describe('sanitizeDetails', () => {
    it('should sanitize paths in details object', () => {
      const details = {
        installPath: join(projectRoot, 'some', 'where'),
        other: 'value',
        nested: {
          filePath: join(home, 'secret.txt'),
        },
        list: [join(globalRoot, 'lib'), 'not-a-path'],
      };

      // @ts-expect-error - accessing private method for testing
      const sanitized = logger.sanitizeDetails(details);

      expect(sanitized.installPath).toBe(join('<PROJECT_ROOT>', 'some', 'where'));
      expect(sanitized.other).toBe('value');
      expect(sanitized.nested.filePath).toBe(join('<HOME>', 'secret.txt'));
      expect(sanitized.list[0]).toBe(join('<GLOBAL_ROOT>', 'lib'));
      expect(sanitized.list[1]).toBe('not-a-path');
    });
  });
});
