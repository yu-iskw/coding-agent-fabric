/**
 * Interactive prompt utilities
 */

import inquirer from 'inquirer';
import type { AgentType, Resource } from '@coding-agent-fabric/common';

/**
 * Prompt for confirmation
 */
export async function confirmAction(message: string, defaultValue = false): Promise<boolean> {
  const { confirmed } = await inquirer.prompt<{ confirmed: boolean }>([
    {
      type: 'confirm',
      name: 'confirmed',
      message,
      default: defaultValue,
    },
  ]);

  return confirmed;
}

/**
 * Prompt for agent selection
 */
export async function selectAgents(
  availableAgents: AgentType[],
  message = 'Select target agents:',
): Promise<AgentType[]> {
  const { agents } = await inquirer.prompt<{ agents: AgentType[] }>([
    {
      type: 'checkbox',
      name: 'agents',
      message,
      choices: availableAgents.map((agent) => ({
        name: agent,
        value: agent,
      })),
    },
  ]);

  return agents;
}

/**
 * Prompt for scope selection
 */
export async function selectScope(
  message = 'Select installation scope:',
): Promise<'global' | 'project'> {
  const { scope } = await inquirer.prompt<{ scope: 'global' | 'project' }>([
    {
      type: 'list',
      name: 'scope',
      message,
      choices: [
        { name: 'Project (current project only)', value: 'project' },
        { name: 'Global (all projects)', value: 'global' },
      ],
      default: 'project',
    },
  ]);

  return scope;
}

/**
 * Prompt for install mode selection
 */
export async function selectMode(
  message = 'Select installation mode:',
): Promise<'copy' | 'symlink'> {
  const { mode } = await inquirer.prompt<{ mode: 'copy' | 'symlink' }>([
    {
      type: 'list',
      name: 'mode',
      message,
      choices: [
        { name: 'Copy (standalone files)', value: 'copy' },
        { name: 'Symlink (linked to source)', value: 'symlink' },
      ],
      default: 'copy',
    },
  ]);

  return mode;
}

/**
 * Prompt for resource selection
 */
export async function selectResources(
  resources: Resource[],
  message = 'Select resources to install:',
): Promise<Resource[]> {
  const { selected } = await inquirer.prompt<{ selected: string[] }>([
    {
      type: 'checkbox',
      name: 'selected',
      message,
      choices: resources.map((resource) => ({
        name: `${resource.name} - ${resource.description}`,
        value: resource.name,
        checked: true,
      })),
    },
  ]);

  return resources.filter((r) => selected.includes(r.name));
}

/**
 * Prompt for text input
 */
export async function promptText(message: string, defaultValue?: string): Promise<string> {
  const { value } = await inquirer.prompt<{ value: string }>([
    {
      type: 'input',
      name: 'value',
      message,
      default: defaultValue,
    },
  ]);

  return value;
}
