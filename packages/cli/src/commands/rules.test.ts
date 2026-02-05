import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { createRulesCommand } from './rules.js';

const { listMock, removeMock, logger, spinner } = vi.hoisted(() => ({
  listMock: vi.fn(),
  removeMock: vi.fn(),
  logger: {
    header: vi.fn(),
    log: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  spinner: {
    start: vi.fn(),
    succeed: vi.fn(),
  },
}));

vi.mock('@coding-agent-fabric/core', () => {
  class AgentRegistry {
    constructor(_projectRoot: string) {}
  }

  class RulesHandler {
    constructor(_options: unknown) {}

    async list(scope: 'global' | 'project' | 'both') {
      return listMock(scope);
    }

    async remove(resource: unknown, targets: unknown, options: unknown) {
      return removeMock(resource, targets, options);
    }
  }

  return {
    AgentRegistry,
    RulesHandler,
  };
});

vi.mock('../utils/logger.js', () => ({
  logger,
}));

vi.mock('../utils/spinner.js', () => ({
  spinner,
}));

vi.mock('../utils/prompts.js', () => ({
  confirmAction: vi.fn(async () => true),
  selectAgents: vi.fn(async () => []),
  selectScope: vi.fn(async () => 'project'),
  selectMode: vi.fn(async () => 'copy'),
  selectResources: vi.fn(async () => []),
}));

describe('rules command', () => {
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`process.exit:${code}`);
    }) as never);
  });

  afterEach(() => {
    exitSpy.mockRestore();
  });

  it('removes only the requested agent when --agent is provided', async () => {
    listMock.mockResolvedValue({
      resources: [
        {
          type: 'rules',
          name: 'test-rule',
          description: 'desc',
          metadata: {},
          files: [],
          source: '',
          sourceType: 'local',
          sourceUrl: '',
          installedAt: '',
          updatedAt: '',
          installedFor: [
            { agent: 'cursor', scope: 'project', path: '/tmp/cursor/test-rule.mdc' },
            { agent: 'claude-code', scope: 'project', path: '/tmp/claude/test-rule.md' },
          ],
        },
      ],
      errors: [],
    });

    const command = createRulesCommand();
    await command.parseAsync(['remove', 'test-rule', '--agent', 'cursor', '--yes'], {
      from: 'user',
    });

    expect(removeMock).toHaveBeenCalledTimes(1);
    expect(removeMock.mock.calls[0][1]).toEqual([
      {
        agent: 'cursor',
        mode: 'copy',
        scope: 'project',
      },
    ]);
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('returns success when --force is used and rule is not found', async () => {
    listMock.mockResolvedValue({
      resources: [],
      errors: [],
    });

    const command = createRulesCommand();
    await command.parseAsync(['remove', 'missing-rule', '--force', '--yes'], { from: 'user' });

    expect(removeMock).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      "Rule 'missing-rule' not found (skipping due to --force)",
    );
    expect(exitSpy).not.toHaveBeenCalled();
  });
});
