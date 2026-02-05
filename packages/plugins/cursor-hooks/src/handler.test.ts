import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { CursorHooksHandler } from './handler.js';

describe('CursorHooksHandler', () => {
  let testDir: string;
  let originalCwd: string;
  let handler: CursorHooksHandler;

  beforeEach(async () => {
    originalCwd = process.cwd();
    testDir = await mkdtemp(join(tmpdir(), 'cursor-hooks-handler-'));
    process.chdir(testDir);

    handler = new CursorHooksHandler({
      version: '0.1.0',
      configDir: testDir,
      pluginDir: testDir,
      log: {
        debug: () => undefined,
        info: () => undefined,
        warn: () => undefined,
        error: () => undefined,
      },
    });
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await rm(testDir, { recursive: true, force: true });
  });

  it('should require force before overwriting existing hooks', async () => {
    const targets = [
      { agent: 'cursor' as const, scope: 'project' as const, mode: 'copy' as const },
    ];
    const resource = {
      type: 'cursor-hooks',
      name: 'test-hook',
      description: 'Test hook',
      metadata: {
        hookType: 'onSave',
      },
      files: [
        {
          path: 'test-hook.json',
          content: JSON.stringify({ hookType: 'onSave', command: 'echo first' }),
        },
      ],
    };

    await handler.install(resource, targets, { force: false });

    resource.files[0].content = JSON.stringify({ hookType: 'onSave', command: 'echo second' });
    await expect(handler.install(resource, targets, { force: false })).rejects.toThrow(
      'already exists',
    );

    const hookPath = join(testDir, '.cursor', 'hooks', 'test-hook.json');
    expect(await readFile(hookPath, 'utf-8')).toBe(
      JSON.stringify({ hookType: 'onSave', command: 'echo first' }),
    );

    await handler.install(resource, targets, { force: true });
    expect(await readFile(hookPath, 'utf-8')).toBe(
      JSON.stringify({ hookType: 'onSave', command: 'echo second' }),
    );
  });
});
