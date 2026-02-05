/**
 * Logger utilities
 */

import chalk from 'chalk';

export class Logger {
  private verbose: boolean;

  constructor(verbose = false) {
    this.verbose = verbose;
  }

  info(message: string): void {
    console.log(chalk.blue('ℹ'), message);
  }

  success(message: string): void {
    console.log(chalk.green('✓'), message);
  }

  error(message: string): void {
    console.error(chalk.red('✗'), message);
  }

  warn(message: string): void {
    console.warn(chalk.yellow('⚠'), message);
  }

  debug(message: string): void {
    if (this.verbose) {
      console.log(chalk.gray('→'), message);
    }
  }

  log(message: string): void {
    console.log(message);
  }

  header(message: string): void {
    console.log('\n' + chalk.bold(message));
  }

  section(message: string): void {
    console.log('\n' + chalk.bold.underline(message));
  }
}

export const logger = new Logger();
