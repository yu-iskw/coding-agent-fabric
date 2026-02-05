#!/usr/bin/env node

/**
 * Main CLI entry point
 */

import { Command } from 'commander';
import { createSkillsCommand } from './commands/skills.js';
import { createSubagentsCommand } from './commands/subagents.js';
import { createRulesCommand } from './commands/rules.js';
import { createPluginCommand } from './commands/plugin.js';
import { registerSystemCommands } from './commands/system.js';

const program = new Command();

program
  .name('coding-agent-fabric')
  .description('Universal resource manager for AI coding agents')
  .version('0.1.0');

// Add commands
program.addCommand(createSkillsCommand());
program.addCommand(createSubagentsCommand());
program.addCommand(createRulesCommand());
program.addCommand(createPluginCommand());

// Register system commands (doctor, check, update)
registerSystemCommands(program);

// Parse arguments
program.parse();
