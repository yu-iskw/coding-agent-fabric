/**
 * System commands (doctor, check, update)
 */

import { Command } from 'commander';
import { AgentRegistry, LockManager } from '@coding-agent-fabric/core';
import { logger } from '../utils/logger.js';
import { spinner } from '../utils/spinner.js';
import { cwd } from 'node:process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Create system commands
 */
export function registerSystemCommands(program: Command): void {
  program
    .command('doctor')
    .description('Check the health of your installation')
    .action(async () => {
      await runDoctor();
    });

  program
    .command('check')
    .description('Check for updates across all resources')
    .action(async () => {
      await runCheck();
    });

  program
    .command('update')
    .description('Update all resources to their latest versions')
    .action(async () => {
      await runUpdate();
    });
}

/**
 * Run doctor command
 */
async function runDoctor(): Promise<void> {
  const projectRoot = cwd();
  logger.header('coding-agent-fabric Doctor');

  // Check agents
  spinner.start('Checking agents...');
  const agentRegistry = new AgentRegistry(projectRoot);
  const supportedAgents = agentRegistry.getAllNames();
  const installedAgents = await agentRegistry.detectInstalled();
  spinner.succeed(`Found ${supportedAgents.length} supported agents`);

  for (const agent of supportedAgents) {
    if (installedAgents.includes(agent)) {
      logger.log(`  ${agent}: Installed`);
    }
  }

  // Check lock file
  spinner.start('Checking lock file...');
  const lockManager = new LockManager({ projectRoot });
  if (lockManager.exists()) {
    spinner.succeed(`Lock file found at ${lockManager.getPath()}`);
    try {
      const lockFile = await lockManager.load();
      logger.log(`  Version: ${lockFile.version}`);
      logger.log(`  Last updated: ${lockFile.lastUpdated}`);
      logger.log(`  Resources: ${Object.keys(lockFile.resources).length}`);
    } catch (error) {
      spinner.fail(`Failed to load lock file: ${error}`);
    }
  } else {
    spinner.warn('No lock file found in current project');
  }

  // Check directories
  spinner.start('Checking configuration...');
  const configDir = join(projectRoot, '.coding-agent-fabric');
  if (existsSync(configDir)) {
    spinner.succeed(`Configuration directory found at ${configDir}`);
  } else {
    spinner.info('No configuration directory found (will be created on first use)');
  }

  logger.success('\nDoctor check complete!');
}

/**
 * Run check command
 */
async function runCheck(): Promise<void> {
  logger.info('Update checking not yet fully implemented');
  // TODO: Implement update checking logic using SourceParser and LockManager
}

/**
 * Run update command
 */
async function runUpdate(): Promise<void> {
  logger.info('Resource updating not yet fully implemented');
  // TODO: Implement actual update logic
}
