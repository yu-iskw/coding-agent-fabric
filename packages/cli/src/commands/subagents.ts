/**
 * Subagents commands
 */

import { Command } from 'commander';
import {
  AgentRegistry,
  LockManager,
  SourceParser,
  SubagentsHandler,
} from '@coding-agent-fabric/core';
import { parseSource, type AgentType, type Scope } from '@coding-agent-fabric/common';
import type { AddOptions, ListOptions, RemoveOptions, UpdateOptions } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { spinner } from '../utils/spinner.js';
import { confirmAction, selectAgents, selectScope, selectResources } from '../utils/prompts.js';
import { join } from 'node:path';
import { cwd } from 'node:process';

/**
 * Create subagents command
 */
export function createSubagentsCommand(): Command {
  const cmd = new Command('subagents').description('Manage AI subagents');

  // Add subcommand
  cmd
    .command('add')
    .description('Install subagents from a source')
    .argument('<source>', 'Source to install from (e.g., owner/repo, ./local/path)')
    .option('-g, --global', 'Install globally')
    .option('-f, --force', 'Force reinstall')
    .option('-y, --yes', 'Skip confirmation prompts')
    .option('--agent <agent>', 'Target specific agent')
    .action(async (source: string, options: AddOptions) => {
      try {
        await addSubagents(source, options);
      } catch (error) {
        logger.error(`Failed to add subagents: ${error}`);
        process.exit(1);
      }
    });

  // List subcommand
  cmd
    .command('list')
    .description('List installed subagents')
    .option('-g, --global', 'List global subagents only')
    .option('-p, --project', 'List project subagents only')
    .option('-a, --all', 'List all subagents (default)')
    .action(async (options: ListOptions) => {
      try {
        await listSubagents(options);
      } catch (error) {
        logger.error(`Failed to list subagents: ${error}`);
        process.exit(1);
      }
    });

  // Remove subcommand
  cmd
    .command('remove')
    .description('Remove a subagent')
    .argument('<name>', 'Name of the subagent to remove')
    .option('-g, --global', 'Remove from global scope')
    .option('-y, --yes', 'Skip confirmation prompts')
    .option('--agent <agent>', 'Target specific agent')
    .action(async (name: string, options: RemoveOptions) => {
      try {
        await removeSubagent(name, options);
      } catch (error) {
        logger.error(`Failed to remove subagent: ${error}`);
        process.exit(1);
      }
    });

  // Update subcommand
  cmd
    .command('update')
    .description('Update all subagents')
    .option('--check-only', 'Only check for updates without installing')
    .action(async (options: UpdateOptions) => {
      try {
        await updateSubagents(options);
      } catch (error) {
        logger.error(`Failed to update subagents: ${error}`);
        process.exit(1);
      }
    });

  return cmd;
}

/**
 * Add subagents from a source
 */
async function addSubagents(source: string, options: AddOptions): Promise<void> {
  const projectRoot = cwd();

  logger.header('Installing Subagents');

  // Initialize components
  const agentRegistry = new AgentRegistry(projectRoot);
  const lockManager = new LockManager({ projectRoot });
  const sourceParser = new SourceParser();
  const subagentsHandler = new SubagentsHandler({
    agentRegistry,
    lockManager,
    projectRoot,
  });

  // Parse source
  spinner.start('Parsing source...');
  const parsedSource = parseSource(source);
  spinner.succeed(`Source parsed: ${parsedSource.type}`);

  // Download and discover resources
  spinner.start('Discovering subagents...');
  let downloadedPath = parsedSource.localPath;

  if (parsedSource.type !== 'local') {
    const result = await sourceParser.parse(source, {
      targetDir: join(projectRoot, '.coding-agent-fabric', 'cache'),
    });
    downloadedPath = result.localDir;
  }

  const resources = await subagentsHandler.discover({ ...parsedSource, localPath: downloadedPath });
  spinner.succeed(`Found ${resources.length} subagent(s)`);

  if (resources.length === 0) {
    logger.warn('No subagents found in source');
    return;
  }

  // Select resources (if interactive)
  let selectedResources = resources;
  if (!options.yes && resources.length > 1) {
    selectedResources = await selectResources(resources);
  }

  if (selectedResources.length === 0) {
    logger.info('No subagents selected');
    return;
  }

  // Select target agents
  let targetAgents = options.agent ? [options.agent] : subagentsHandler.getSupportedAgents();
  if (!options.yes && !options.agent) {
    targetAgents = await selectAgents(subagentsHandler.getSupportedAgents());
  }

  if (targetAgents.length === 0) {
    logger.warn('No agents selected');
    return;
  }

  // Select scope
  const scope = options.global
    ? 'global'
    : options.scope || (!options.yes ? await selectScope() : 'project');

  // Confirm installation
  if (!options.yes) {
    logger.log('\nInstallation summary:');
    logger.log(`  Resources: ${selectedResources.map((r) => r.name).join(', ')}`);
    logger.log(`  Agents: ${targetAgents.join(', ')}`);
    logger.log(`  Scope: ${scope}`);

    const confirmed = await confirmAction('Proceed with installation?', true);
    if (!confirmed) {
      logger.info('Installation cancelled');
      return;
    }
  }

  // Install each resource
  for (const resource of selectedResources) {
    spinner.start(`Installing ${resource.name}...`);

    const targets = targetAgents.map((agent) => ({
      agent,
      scope,
      mode: 'copy' as const,
    }));

    await subagentsHandler.install(resource, targets, {
      force: options.force,
      yes: options.yes,
    });

    // Update lock file
    await lockManager.addResource({
      type: 'subagents',
      handler: 'built-in',
      name: resource.name,
      version: resource.version,
      source,
      sourceType: parsedSource.type,
      sourceUrl: parsedSource.url,
      installedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      installedFor: targets.map((t) => ({
        agent: t.agent,
        scope: t.scope,
        path: subagentsHandler.getInstallPath(t.agent, t.scope),
      })),
      model: resource.metadata.model as string,
      format: resource.metadata.format as 'claude-code-yaml' | 'coding-agent-fabric-json',
      configHash: resource.metadata.configHash as string,
    });

    spinner.succeed(`Installed ${resource.name}`);
  }

  logger.success('\nSubagents installed successfully!');
}

/**
 * List installed subagents
 */
async function listSubagents(options: ListOptions): Promise<void> {
  const projectRoot = cwd();

  const agentRegistry = new AgentRegistry(projectRoot);
  const lockManager = new LockManager({ projectRoot });
  const subagentsHandler = new SubagentsHandler({
    agentRegistry,
    lockManager,
    projectRoot,
  });

  const scope = options.global ? 'global' : options.project ? 'project' : 'both';
  const subagents = await subagentsHandler.list(scope);

  if (subagents.length === 0) {
    logger.info('No subagents installed');
    return;
  }

  logger.header('Installed Subagents');
  for (const subagent of subagents) {
    logger.log(`\n  ${subagent.name}${subagent.version ? ` (v${subagent.version})` : ''}`);
    logger.log(`    Source: ${subagent.source}`);
    logger.log(`    Installed for: ${subagent.installedFor.map((i) => i.agent).join(', ')}`);
  }
}

/**
 * Remove a subagent
 */
async function removeSubagent(name: string, options: RemoveOptions): Promise<void> {
  const projectRoot = cwd();

  const agentRegistry = new AgentRegistry(projectRoot);
  const lockManager = new LockManager({ projectRoot });
  const subagentsHandler = new SubagentsHandler({
    agentRegistry,
    lockManager,
    projectRoot,
  });

  // Load lock file to get resource info
  const resourceEntry = await lockManager.getResource(name);

  if (!resourceEntry || resourceEntry.type !== 'subagents') {
    logger.error(`Subagent '${name}' not found`);
    process.exit(1);
  }

  // Confirm removal
  if (!options.yes) {
    const confirmed = await confirmAction(`Remove subagent '${name}'?`, false);
    if (!confirmed) {
      logger.info('Removal cancelled');
      return;
    }
  }

  // Remove from targets
  const scope: 'global' | 'project' | 'both' = options.global ? 'global' : options.scope || 'both';
  const targets = resourceEntry.installedFor
    .filter((install: { scope: string }) => scope === 'both' || install.scope === scope)
    .map((install: { agent: string; scope: string }) => ({
      agent: install.agent as AgentType,
      scope: install.scope as Scope,
      mode: 'copy' as const,
    }));

  spinner.start(`Removing ${name}...`);

  await subagentsHandler.remove(
    {
      type: 'subagents',
      name,
      description: '',
      metadata: {},
      files: [],
    },
    targets,
    { yes: options.yes },
  );

  // Update lock file
  await lockManager.removeResource(name);

  spinner.succeed(`Removed ${name}`);
  logger.success('Subagent removed successfully!');
}

/**
 * Update all subagents
 */
async function updateSubagents(_options: UpdateOptions): Promise<void> {
  logger.info('Update functionality not yet implemented');
  // TODO: Implement update logic
}
