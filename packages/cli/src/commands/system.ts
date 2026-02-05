/**
 * System commands (doctor, check, update)
 */

import { Command } from 'commander';
import { AgentRegistry } from '@coding-agent-fabric/core';
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

  // Check directories
  spinner.start('Checking configuration...');
  const configDir = join(projectRoot, '.coding-agent-fabric');
  if (existsSync(configDir)) {
    spinner.succeed(`Configuration directory found at ${configDir}`);
  } else {
    spinner.info('No configuration directory found (will be created on first use)');
  }

  // Check node_modules for resources
  spinner.start('Checking for installed resource packages...');
  const pkgJsonPath = join(projectRoot, 'package.json');
  if (existsSync(pkgJsonPath)) {
    spinner.succeed('package.json found');
  } else {
    spinner.warn('No package.json found in current directory');
  }

  logger.success('\nDoctor check complete!');
}

/**
 * Run check command
 */
async function runCheck(): Promise<void> {
  logger.info('Update checking not yet fully implemented');
  // TODO: Implement update checking logic using pnpm
}

/**
 * Run update command
 */
async function runUpdate(): Promise<void> {
  logger.info('Resource updating not yet fully implemented');
  // TODO: Implement actual update logic using pnpm update
}
