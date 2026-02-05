/**
 * Skills commands
 */

import { Command } from 'commander';
import { AgentRegistry, LockManager, SourceParser, SkillsHandler } from '@coding-agent-fabric/core';
import {
  parseSource,
  type NamingStrategy,
  type AgentType,
  type Scope,
} from '@coding-agent-fabric/common';
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
import { join } from 'node:path';
import { cwd } from 'node:process';

/**
 * Create skills command
 */
export function createSkillsCommand(): Command {
  const cmd = new Command('skills').description('Manage AI agent skills');

  // Add subcommand
  cmd
    .command('add')
    .description('Install skills from a source')
    .argument('<source>', 'Source to install from (e.g., owner/repo, ./local/path)')
    .option('-g, --global', 'Install globally')
    .option('-f, --force', 'Force reinstall')
    .option('-y, --yes', 'Skip confirmation prompts')
    .option('--agent <agent>', 'Target specific agent')
    .option('--mode <mode>', 'Installation mode (copy or symlink)')
    .action(async (source: string, options: AddOptions) => {
      try {
        await addSkills(source, options);
      } catch (error) {
        logger.error(`Failed to add skills: ${error}`);
        process.exit(1);
      }
    });

  // List subcommand
  cmd
    .command('list')
    .description('List installed skills')
    .option('-g, --global', 'List global skills only')
    .option('-p, --project', 'List project skills only')
    .option('-a, --all', 'List all skills (default)')
    .action(async (options: ListOptions) => {
      try {
        await listSkills(options);
      } catch (error) {
        logger.error(`Failed to list skills: ${error}`);
        process.exit(1);
      }
    });

  // Remove subcommand
  cmd
    .command('remove')
    .description('Remove a skill')
    .argument('<name>', 'Name of the skill to remove')
    .option('-g, --global', 'Remove from global scope')
    .option('-y, --yes', 'Skip confirmation prompts')
    .option('--agent <agent>', 'Target specific agent')
    .action(async (name: string, options: RemoveOptions) => {
      try {
        await removeSkill(name, options);
      } catch (error) {
        logger.error(`Failed to remove skill: ${error}`);
        process.exit(1);
      }
    });

  // Update subcommand
  cmd
    .command('update')
    .description('Update all skills')
    .option('--check-only', 'Only check for updates without installing')
    .action(async (options: UpdateOptions) => {
      try {
        await updateSkills(options);
      } catch (error) {
        logger.error(`Failed to update skills: ${error}`);
        process.exit(1);
      }
    });

  return cmd;
}

/**
 * Add skills from a source
 */
async function addSkills(source: string, options: AddOptions): Promise<void> {
  const projectRoot = cwd();

  logger.header('Installing Skills');

  // Initialize components
  const agentRegistry = new AgentRegistry(projectRoot);
  const lockManager = new LockManager({ projectRoot });
  const sourceParser = new SourceParser();
  const skillsHandler = new SkillsHandler({
    agentRegistry,
    lockManager,
    projectRoot,
  });

  // Parse source
  spinner.start('Parsing source...');
  const parsedSource = parseSource(source);
  spinner.succeed(`Source parsed: ${parsedSource.type}`);

  // Download and discover resources
  spinner.start('Discovering skills...');
  let downloadedPath = parsedSource.localPath;

  if (parsedSource.type !== 'local') {
    const result = await sourceParser.parse(source, {
      targetDir: join(projectRoot, '.coding-agent-fabric', 'cache'),
    });
    downloadedPath = result.localDir;
  }

  const resources = await skillsHandler.discover(
    { ...parsedSource, localPath: downloadedPath },
    {
      namingStrategy: options.namingStrategy as NamingStrategy,
      categories: options.categories,
    },
  );
  spinner.succeed(`Found ${resources.length} skill(s)`);

  if (resources.length === 0) {
    logger.warn('No skills found in source');
    return;
  }

  // Select resources (if interactive)
  let selectedResources = resources;
  if (!options.yes && resources.length > 1) {
    selectedResources = await selectResources(resources);
  }

  if (selectedResources.length === 0) {
    logger.info('No skills selected');
    return;
  }

  // Select target agents
  let targetAgents = options.agent ? [options.agent] : skillsHandler.getSupportedAgents();
  if (!options.yes && !options.agent) {
    targetAgents = await selectAgents(skillsHandler.getSupportedAgents());
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

    await skillsHandler.install(resource, targets, {
      force: options.force,
      yes: options.yes,
    });

    // Update lock file
    await lockManager.addResource({
      type: 'skills',
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
        path: skillsHandler.getInstallPath(t.agent, t.scope),
      })),
      originalName: (resource.metadata.originalName as string) || resource.name,
      installedName: resource.name,
      sourcePath: (resource.metadata.sourcePath as string) || '',
      categories: (resource.metadata.categories as string[]) || [],
      namingStrategy: options.namingStrategy as NamingStrategy,
    });

    spinner.succeed(`Installed ${resource.name}`);
  }

  logger.success('\nSkills installed successfully!');
}

/**
 * List installed skills
 */
async function listSkills(options: ListOptions): Promise<void> {
  const projectRoot = cwd();

  const agentRegistry = new AgentRegistry(projectRoot);
  const lockManager = new LockManager({ projectRoot });
  const skillsHandler = new SkillsHandler({
    agentRegistry,
    lockManager,
    projectRoot,
  });

  const scope = options.global ? 'global' : options.project ? 'project' : 'both';
  const skills = await skillsHandler.list(scope);

  if (skills.length === 0) {
    logger.info('No skills installed');
    return;
  }

  logger.header('Installed Skills');
  for (const skill of skills) {
    logger.log(`\n  ${skill.name}${skill.version ? ` (v${skill.version})` : ''}`);
    logger.log(`    Source: ${skill.source}`);
    logger.log(`    Installed for: ${skill.installedFor.map((i) => i.agent).join(', ')}`);
  }
}

/**
 * Remove a skill
 */
async function removeSkill(name: string, options: RemoveOptions): Promise<void> {
  const projectRoot = cwd();

  const agentRegistry = new AgentRegistry(projectRoot);
  const lockManager = new LockManager({ projectRoot });
  const skillsHandler = new SkillsHandler({
    agentRegistry,
    lockManager,
    projectRoot,
  });

  // Load lock file to get resource info
  const resourceEntry = await lockManager.getResource(name);

  if (!resourceEntry || resourceEntry.type !== 'skills') {
    logger.error(`Skill '${name}' not found`);
    process.exit(1);
  }

  // Confirm removal
  if (!options.yes) {
    const confirmed = await confirmAction(`Remove skill '${name}'?`, false);
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

  await skillsHandler.remove(
    {
      type: 'skills',
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
  logger.success('Skill removed successfully!');
}

/**
 * Update all skills
 */
async function updateSkills(_options: UpdateOptions): Promise<void> {
  logger.info('Update functionality not yet implemented');
  // TODO: Implement update logic
}
