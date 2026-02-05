/**
 * Rules commands
 */

import { Command } from 'commander';
import { AgentRegistry, RulesHandler } from '@coding-agent-fabric/core';
import { type NamingStrategy, type AgentType, type Scope } from '@coding-agent-fabric/common';
import type { AddOptions, ListOptions, RemoveOptions, UpdateOptions } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { spinner } from '../utils/spinner.js';
import {
  confirmAction,
  selectAgents,
  selectScope,
  selectMode,
  selectResources,
} from '../utils/prompts.js';
import { pnpmAdd, resolvePackagePath } from '../utils/pnpm.js';
import { isGitUrl, cloneRepo } from '../utils/git.js';
import { cwd } from 'node:process';

/**
 * Create rules command
 */
export function createRulesCommand(): Command {
  const cmd = new Command('rules').description('Manage AI agent rules');

  // Add subcommand
  cmd
    .command('add')
    .description('Install rules from a source')
    .argument('<source>', 'Source to install from (e.g., owner/repo, ./local/path)')
    .option('-g, --global', 'Install globally')
    .option('-f, --force', 'Force reinstall')
    .option('-y, --yes', 'Skip confirmation prompts')
    .option('--agent <agent>', 'Target specific agent')
    .option('--mode <mode>', 'Installation mode (copy or symlink)')
    .action(async (source: string, options: AddOptions) => {
      try {
        await addRules(source, options);
      } catch (error) {
        logger.error(`Failed to add rules: ${error instanceof Error ? error.message : error}`);
        process.exit(1);
      }
    });

  // List subcommand
  cmd
    .command('list')
    .description('List installed rules')
    .option('-g, --global', 'List global rules only')
    .option('-p, --project', 'List project rules only')
    .option('-a, --all', 'List all rules (default)')
    .action(async (options: ListOptions) => {
      try {
        await listRules(options);
      } catch (error) {
        logger.error(`Failed to list rules: ${error instanceof Error ? error.message : error}`);
        process.exit(1);
      }
    });

  // Remove subcommand
  cmd
    .command('remove')
    .description('Remove a rule')
    .argument('<name>', 'Name of the rule to remove')
    .option('-g, --global', 'Remove from global scope')
    .option('-f, --force', 'Force removal even if not found')
    .option('-y, --yes', 'Skip confirmation prompts')
    .option('--agent <agent>', 'Target specific agent')
    .action(async (name: string, options: RemoveOptions) => {
      try {
        await removeRule(name, options);
      } catch (error) {
        logger.error(`Failed to remove rule: ${error instanceof Error ? error.message : error}`);
        process.exit(1);
      }
    });

  // Update subcommand
  cmd
    .command('update')
    .description('Update all rules')
    .option('--check-only', 'Only check for updates without installing')
    .action(async (options: UpdateOptions) => {
      try {
        await updateRules(options);
      } catch (error) {
        logger.error(`Failed to update rules: ${error instanceof Error ? error.message : error}`);
        process.exit(1);
      }
    });

  return cmd;
}

/**
 * Add rules from a source
 */
async function addRules(source: string, options: AddOptions): Promise<void> {
  const projectRoot = cwd();

  logger.header('Installing Rules');

  // Initialize components
  const agentRegistry = new AgentRegistry(projectRoot);
  const rulesHandler = new RulesHandler({
    agentRegistry,
    projectRoot,
  });

  // Use pnpm to add the package or git to clone
  let packagePath: string;
  let packageName: string;
  let cleanup: (() => Promise<void>) | undefined;

  if (isGitUrl(source)) {
    // Git source
    spinner.start(`Cloning ${source}...`);
    const result = await cloneRepo(source);
    packagePath = result.path;
    packageName = source;
    cleanup = result.cleanup;
    spinner.succeed(`Cloned ${source}`);
  } else if (source.startsWith('.') || source.startsWith('/') || source.startsWith('~')) {
    // Local source
    packageName = await pnpmAdd(source, projectRoot);
    packagePath = resolvePackagePath(packageName, projectRoot);
  } else {
    // Remote source (npm)
    packageName = await pnpmAdd(source, projectRoot);
    packagePath = resolvePackagePath(packageName, projectRoot);
  }

  try {
    // Discover resources from the installed package
    spinner.start('Discovering rules...');
    const resources = await rulesHandler.discoverFromPath(packagePath, {
      namingStrategy: options.namingStrategy as NamingStrategy,
      categories: options.categories,
    });
    spinner.succeed(`Found ${resources.length} rule(s) in ${packageName}`);

    if (resources.length === 0) {
      logger.warn('No rules found in source');
      return;
    }

    // Select resources (if interactive)
    let selectedResources = resources;
    if (!options.yes && resources.length > 1) {
      selectedResources = await selectResources(resources);
    }

    if (selectedResources.length === 0) {
      logger.info('No rules selected');
      return;
    }

    // Select target agents
    let targetAgents = options.agent ? [options.agent] : rulesHandler.getSupportedAgents();
    if (!options.yes && !options.agent) {
      targetAgents = await selectAgents(rulesHandler.getSupportedAgents());
    }

    if (targetAgents.length === 0) {
      logger.warn('No agents selected');
      return;
    }

    // Select scope and mode
    const scope = options.global
      ? 'global'
      : options.scope || (!options.yes ? await selectScope() : 'project');
    const mode = options.mode || (!options.yes ? await selectMode() : 'copy');

    // Confirm installation
    if (!options.yes) {
      logger.log('\nInstallation summary:');
      logger.log(`  Resources: ${selectedResources.map((r) => r.name).join(', ')}`);
      logger.log(`  Agents: ${targetAgents.join(', ')}`);
      logger.log(`  Scope: ${scope}`);
      logger.log(`  Mode: ${mode}`);

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
        mode,
      }));

      await rulesHandler.install(resource, targets, {
        force: options.force,
        yes: options.yes,
      });

      spinner.succeed(`Installed ${resource.name}`);
    }

    logger.success('\nRules installed successfully!');
  } finally {
    // Clean up temporary git clone if needed
    if (cleanup) {
      await cleanup();
    }
  }
}

/**
 * List installed rules
 */
async function listRules(options: ListOptions): Promise<void> {
  const projectRoot = cwd();

  const agentRegistry = new AgentRegistry(projectRoot);
  const rulesHandler = new RulesHandler({
    agentRegistry,
    projectRoot,
  });

  const scope = options.global ? 'global' : options.project ? 'project' : 'both';
  const { resources: rules, errors } = await rulesHandler.list(scope);

  if (errors.length > 0) {
    for (const error of errors) {
      logger.warn(`Failed to list rules for ${error.agent} (${error.scope}): ${error.error}`);
    }
  }

  if (rules.length === 0) {
    logger.info('No rules installed');
    return;
  }

  logger.header('Installed Rules');
  for (const rule of rules) {
    logger.log(`\n  ${rule.name}${rule.version ? ` (v${rule.version})` : ''}`);
    if (rule.source) {
      logger.log(`    Source: ${rule.source}`);
    }
    logger.log(`    Installed for: ${rule.installedFor.map((i) => i.agent).join(', ')}`);
    if (rule.metadata?.globs) {
      logger.log(`    Globs: ${JSON.stringify(rule.metadata.globs)}`);
    }
  }
}

/**
 * Remove a rule
 */
async function removeRule(name: string, options: RemoveOptions): Promise<void> {
  const projectRoot = cwd();

  const agentRegistry = new AgentRegistry(projectRoot);
  const rulesHandler = new RulesHandler({
    agentRegistry,
    projectRoot,
  });

  // Find the rule in installed resources
  const { resources: rules } = await rulesHandler.list('both');
  const rule = rules.find((r) => r.name === name);

  if (!rule) {
    if (options.force) {
      logger.warn(`Rule '${name}' not found (skipping due to --force)`);
      return;
    }
    logger.error(`Rule '${name}' not found`);
    process.exit(1);
  }

  // Confirm removal
  if (!options.yes) {
    const confirmed = await confirmAction(`Remove rule '${name}'?`, false);
    if (!confirmed) {
      logger.info('Removal cancelled');
      return;
    }
  }

  // Determine targets to remove from
  const scope: 'global' | 'project' | 'both' = options.global ? 'global' : options.scope || 'both';
  const targets = rule.installedFor
    .filter((install) => scope === 'both' || install.scope === scope)
    .filter((install) => !options.agent || install.agent === options.agent)
    .map((install) => ({
      agent: install.agent as AgentType,
      scope: install.scope as Scope,
      mode: 'copy' as const,
    }));

  if (targets.length === 0) {
    logger.warn(`Rule '${name}' is not installed in the specified scope`);
    return;
  }

  spinner.start(`Removing ${name}...`);

  await rulesHandler.remove(rule, targets, { yes: options.yes });

  spinner.succeed(`Removed ${name}`);
  logger.success('Rule removed successfully!');
}

/**
 * Update all rules
 */
async function updateRules(_options: UpdateOptions): Promise<void> {
  logger.info('Update functionality not yet implemented');
  // TODO: Implement update logic
}
