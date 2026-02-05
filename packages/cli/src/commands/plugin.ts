/**
 * Plugin commands
 */

import { Command } from 'commander';
import { PluginManager } from '@coding-agent-fabric/core';
import type { AddOptions, RemoveOptions } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { join } from 'node:path';
import { cwd } from 'node:process';
import { homedir } from 'node:os';

/**
 * Create plugin command
 */
export function createPluginCommand(): Command {
  const cmd = new Command('plugin').description('Manage coding-agent-fabric plugins');

  // Add subcommand
  cmd
    .command('add')
    .description('Install a third-party plugin')
    .argument('<source>', 'Plugin source (e.g., owner/repo, npm:package, ./path)')
    .option('-g, --global', 'Install globally')
    .option('-y, --yes', 'Skip confirmation prompts')
    .action(async (source: string, options: AddOptions) => {
      try {
        await addPlugin(source, options);
      } catch (error) {
        logger.error(`Failed to add plugin: ${error instanceof Error ? error.message : error}`);
        process.exit(1);
      }
    });

  // List subcommand
  cmd
    .command('list')
    .description('List installed plugins')
    .action(async () => {
      try {
        await listPlugins();
      } catch (error) {
        logger.error(`Failed to list plugins: ${error instanceof Error ? error.message : error}`);
        process.exit(1);
      }
    });

  // Remove subcommand
  cmd
    .command('remove')
    .description('Remove a plugin')
    .argument('<id>', 'ID of the plugin to remove')
    .option('-y, --yes', 'Skip confirmation prompts')
    .action(async (id: string, options: RemoveOptions) => {
      try {
        await removePlugin(id, options);
      } catch (error) {
        logger.error(`Failed to remove plugin: ${error instanceof Error ? error.message : error}`);
        process.exit(1);
      }
    });

  return cmd;
}

/**
 * Add a plugin
 */
async function addPlugin(_source: string, _options: AddOptions): Promise<void> {
  logger.header('Installing Plugin');
  logger.info('Plugin installation from source not yet fully implemented');
  // TODO: Implement actual plugin downloading and installation
}

/**
 * List installed plugins
 */
async function listPlugins(): Promise<void> {
  const projectRoot = cwd();
  const searchPaths = [
    join(projectRoot, '.coding-agent-fabric', 'plugins'),
    join(homedir(), '.coding-agent-fabric', 'plugins'),
  ];

  const manager = new PluginManager({
    searchPaths,
    projectRoot,
  });
  await manager.loadAll();

  const plugins = manager.listPlugins();

  if (plugins.length === 0) {
    logger.info('No plugins installed');
    return;
  }

  logger.header('Installed Plugins');
  for (const plugin of plugins) {
    logger.log(`\n  ${plugin.manifest.name} (${plugin.manifest.id}) v${plugin.manifest.version}`);
    logger.log(`    Resource Type: ${plugin.manifest.resourceType}`);
    logger.log(`    Author: ${plugin.manifest.author}`);
    logger.log(`    Location: ${plugin.path}`);
  }
}

/**
 * Remove a plugin
 */
async function removePlugin(id: string, _options: RemoveOptions): Promise<void> {
  // TODO: Implement plugin removal
  logger.info(`Removing plugin ${id} not yet implemented`);
}
