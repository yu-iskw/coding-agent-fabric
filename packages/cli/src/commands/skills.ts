/**
 * Skills commands
 */

import { Command } from 'commander';
import { AgentRegistry, SkillsHandler } from '@coding-agent-fabric/core';
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
        logger.error(`Failed to add skills: ${error instanceof Error ? error.message : error}`);
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
        logger.error(`Failed to list skills: ${error instanceof Error ? error.message : error}`);
        process.exit(1);
      }
    });

  // Remove subcommand
  cmd
    .command('remove')
    .description('Remove a skill')
    .argument('<name>', 'Name of the skill to remove')
    .option('-g, --global', 'Remove from global scope')
    .option('-f, --force', 'Force removal even if not found')
    .option('-y, --yes', 'Skip confirmation prompts')
    .option('--agent <agent>', 'Target specific agent')
    .action(async (name: string, options: RemoveOptions) => {
      try {
        await removeSkill(name, options);
      } catch (error) {
        logger.error(`Failed to remove skill: ${error instanceof Error ? error.message : error}`);
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
        logger.error(`Failed to update skills: ${error instanceof Error ? error.message : error}`);
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
  const skillsHandler = new SkillsHandler({
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
    spinner.start('Discovering skills...');
    const resources = await skillsHandler.discoverFromPath(packagePath, {
      namingStrategy: options.namingStrategy as NamingStrategy,
      categories: options.categories,
    });
    spinner.succeed(`Found ${resources.length} skill(s) in ${packageName}`);

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

      spinner.succeed(`Installed ${resource.name}`);
    }

    logger.success('\nSkills installed successfully!');
  } finally {
    // Clean up temporary git clone if needed
    if (cleanup) {
      await cleanup();
    }
  }
}

/**
 * List installed skills
 */
async function listSkills(options: ListOptions): Promise<void> {
  const projectRoot = cwd();

  const agentRegistry = new AgentRegistry(projectRoot);
  const skillsHandler = new SkillsHandler({
    agentRegistry,
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
    if (skill.source) {
      logger.log(`    Source: ${skill.source}`);
    }
    logger.log(`    Installed for: ${skill.installedFor.map((i) => i.agent).join(', ')}`);
  }
}

/**
 * Remove a skill
 */
async function removeSkill(name: string, options: RemoveOptions): Promise<void> {
  const projectRoot = cwd();

  const agentRegistry = new AgentRegistry(projectRoot);
  const skillsHandler = new SkillsHandler({
    agentRegistry,
    projectRoot,
  });

  // Find the skill in installed resources
  const skills = await skillsHandler.list('both');
  const skill = skills.find((s) => s.name === name);

  if (!skill) {
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

  // Determine targets to remove from
  const scope: 'global' | 'project' | 'both' = options.global ? 'global' : options.scope || 'both';
  const targets = skill.installedFor
    .filter((install) => scope === 'both' || install.scope === scope)
    .map((install) => ({
      agent: install.agent as AgentType,
      scope: install.scope as Scope,
      mode: 'copy' as const,
    }));

  if (targets.length === 0) {
    logger.warn(`Skill '${name}' is not installed in the specified scope`);
    return;
  }

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
