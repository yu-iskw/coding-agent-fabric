/**
 * AuditLogger - Records critical system actions for security and compliance
 */

import { userInfo, homedir } from 'node:os';
import { relative, isAbsolute, join, sep } from 'node:path';
import type { AuditRecord, AuditOutcome } from '@coding-agent-fabric/common';

/**
 * AuditLogger options
 */
export interface AuditLoggerOptions {
  enabled?: boolean;
  logToConsole?: boolean;
  actorId?: string;
  projectRoot?: string;
  globalRoot?: string;
}

/**
 * AuditLogger class for structured auditing
 */
export class AuditLogger {
  private enabled: boolean;
  private logToConsole: boolean;
  private actorId: string;
  private projectRoot?: string;
  private globalRoot?: string;
  private homeDir: string;

  constructor(options: AuditLoggerOptions = {}) {
    this.enabled = options.enabled ?? true;
    this.logToConsole = options.logToConsole ?? true;
    this.actorId = options.actorId || this.getCurrentUser();
    this.projectRoot = options.projectRoot;
    this.globalRoot = options.globalRoot;
    this.homeDir = homedir();
  }

  /**
   * Set the project root for path sanitization
   */
  setProjectRoot(root: string): void {
    this.projectRoot = root;
  }

  /**
   * Set the global root for path sanitization
   */
  setGlobalRoot(root: string): void {
    this.globalRoot = root;
  }

  /**
   * Log an audit event
   */
  log(record: Omit<AuditRecord, 'timestamp' | 'actorId'>): void {
    if (!this.enabled) return;

    // Sanitize targetPath if present
    const sanitizedRecord = {
      ...record,
      targetPath: this.sanitizePath(record.targetPath),
      details: this.sanitizeDetails(record.details),
    };

    const auditRecord: AuditRecord = {
      ...sanitizedRecord,
      timestamp: new Date().toISOString(),
      actorId: this.actorId,
    };

    if (this.logToConsole) {
      // In a real system, this would go to a dedicated audit stream or file
      // Using [AUDIT] prefix for easy filtering/collection
      console.log(`[AUDIT] ${JSON.stringify(auditRecord)}`);
    }
  }

  /**
   * Sanitize a path to remove sensitive information
   */
  private sanitizePath(p: string | undefined): string | undefined {
    if (!p) return p;

    // If it's not an absolute path, we don't need to do much
    if (!isAbsolute(p)) return p;

    // Try project root first (most specific)
    if (this.projectRoot && p.startsWith(this.projectRoot)) {
      return join('<PROJECT_ROOT>', relative(this.projectRoot, p));
    }

    // Try global root
    if (this.globalRoot && p.startsWith(this.globalRoot)) {
      return join('<GLOBAL_ROOT>', relative(this.globalRoot, p));
    }

    // Try home directory
    if (p.startsWith(this.homeDir)) {
      return join('<HOME>', relative(this.homeDir, p));
    }

    // If it's still absolute and we couldn't match any known roots,
    // we should at least mask the user's name if possible
    // But for now, just returning the basename might be safer than full path if it's outside everything
    return p;
  }

  /**
   * Recursively sanitize paths in details object
   */
  private sanitizeDetails(details?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!details) return details;

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(details)) {
      if (typeof value === 'string' && (key.toLowerCase().includes('path') || isAbsolute(value))) {
        sanitized[key] = this.sanitizePath(value);
      } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeDetails(value as Record<string, unknown>);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map((item) =>
          typeof item === 'string' && isAbsolute(item) ? this.sanitizePath(item) : item,
        );
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  /**
   * Helper for successful actions
   */
  success(
    action: string,
    resourceName: string,
    resourceType: string,
    targetPath?: string,
    details?: Record<string, unknown>,
  ): void {
    this.log({
      action,
      resourceName,
      resourceType,
      targetPath,
      outcome: 'success',
      details,
    });
  }

  /**
   * Helper for failed actions
   */
  failure(
    action: string,
    resourceName: string,
    resourceType: string,
    error: string,
    targetPath?: string,
    details?: Record<string, unknown>,
  ): void {
    this.log({
      action,
      resourceName,
      resourceType,
      targetPath,
      outcome: 'failure',
      error,
      details,
    });
  }

  /**
   * Helper for warning actions
   */
  warning(
    action: string,
    resourceName: string,
    resourceType: string,
    details?: Record<string, unknown>,
  ): void {
    this.log({
      action,
      resourceName,
      resourceType,
      outcome: 'warning',
      details,
    });
  }

  /**
   * Get current user from OS
   */
  private getCurrentUser(): string {
    try {
      return userInfo().username || process.env.USER || 'unknown';
    } catch {
      return process.env.USER || 'unknown';
    }
  }
}

// Global default instance
export const auditLogger = new AuditLogger();
