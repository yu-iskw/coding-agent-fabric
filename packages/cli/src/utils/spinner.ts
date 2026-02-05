/**
 * Spinner utilities
 */

import ora, { Ora } from 'ora';

export class Spinner {
  private spinner: Ora | null = null;

  start(text: string): void {
    this.spinner = ora(text).start();
  }

  update(text: string): void {
    if (this.spinner) {
      this.spinner.text = text;
    }
  }

  succeed(text?: string): void {
    if (this.spinner) {
      this.spinner.succeed(text);
      this.spinner = null;
    }
  }

  fail(text?: string): void {
    if (this.spinner) {
      this.spinner.fail(text);
      this.spinner = null;
    }
  }

  warn(text?: string): void {
    if (this.spinner) {
      this.spinner.warn(text);
      this.spinner = null;
    }
  }

  info(text?: string): void {
    if (this.spinner) {
      this.spinner.info(text);
      this.spinner = null;
    }
  }

  stop(): void {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
  }
}

export const spinner = new Spinner();
