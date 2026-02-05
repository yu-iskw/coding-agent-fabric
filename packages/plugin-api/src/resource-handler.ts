/**
 * ResourceHandler interface for coding-agent-fabric
 *
 * All resource types (whether built-in or plugin) implement this interface
 */

import type {
  AgentType,
  Resource,
  InstallTarget,
  ParsedSource,
  InstalledResource,
  ValidationResult,
  UpdateCheck,
  DiscoverOptions,
  InstallOptions,
  RemoveOptions,
  Scope,
} from '@coding-agent-fabric/common';

/**
 * ResourceHandler interface
 *
 * All resource types implement this interface (whether built-in or plugin)
 */
export interface ResourceHandler {
  /**
   * Metadata
   */

  /** Resource type identifier (e.g., "skills", "hooks", "subagents", "mcp") */
  readonly type: string;

  /** Human-readable display name (e.g., "Skills", "Hooks", "Subagents", "MCP Servers") */
  readonly displayName: string;

  /** Description of what this resource type does */
  readonly description: string;

  /** Whether this is a core built-in handler (true) or a plugin handler (false) */
  readonly isCore: boolean;

  /**
   * Discovery
   */

  /**
   * Discover resources from a source
   *
   * @param source - Parsed source information
   * @param options - Discovery options
   * @returns Array of discovered resources
   */
  discover(source: ParsedSource, options?: DiscoverOptions): Promise<Resource[]>;

  /**
   * Lifecycle
   */

  /**
   * Install a resource to target agents
   *
   * @param resource - Resource to install
   * @param targets - Installation targets (agent, scope, mode)
   * @param options - Installation options
   */
  install(resource: Resource, targets: InstallTarget[], options: InstallOptions): Promise<void>;

  /**
   * Remove a resource from target agents
   *
   * @param resource - Resource to remove
   * @param targets - Removal targets (agent, scope)
   * @param options - Removal options
   */
  remove(resource: Resource, targets: InstallTarget[], options: RemoveOptions): Promise<void>;

  /**
   * List installed resources
   *
   * @param scope - Scope to list ('global', 'project', or 'both')
   * @returns Array of installed resources
   */
  list(scope: 'global' | 'project' | 'both'): Promise<InstalledResource[]>;

  /**
   * Validation
   */

  /**
   * Validate a resource configuration
   *
   * @param resource - Resource to validate
   * @returns Validation result with errors and warnings
   */
  validate(resource: Resource): Promise<ValidationResult>;

  /**
   * Updates (optional)
   */

  /**
   * Check for updates to installed resources
   *
   * @param resources - Resources to check
   * @returns Array of update check results
   */
  checkUpdates?(resources: InstalledResource[]): Promise<UpdateCheck[]>;

  /**
   * Update a resource to a new version
   *
   * @param resource - Resource to update
   * @param target - Target version (optional, defaults to latest)
   */
  update?(resource: InstalledResource, target?: string): Promise<void>;

  /**
   * Agent compatibility
   */

  /**
   * Get list of supported agents
   *
   * @returns Array of supported agent types
   */
  getSupportedAgents(): AgentType[];

  /**
   * Get installation path for an agent
   *
   * @param agent - Agent type
   * @param scope - Installation scope
   * @returns Installation path
   */
  getInstallPath(agent: AgentType, scope: Scope): string;
}

/**
 * Base class for resource handlers (optional convenience)
 */
export abstract class BaseResourceHandler implements ResourceHandler {
  abstract readonly type: string;
  abstract readonly displayName: string;
  abstract readonly description: string;
  abstract readonly isCore: boolean;

  abstract discover(source: ParsedSource, options?: DiscoverOptions): Promise<Resource[]>;

  abstract install(
    resource: Resource,
    targets: InstallTarget[],
    options: InstallOptions,
  ): Promise<void>;

  abstract remove(
    resource: Resource,
    targets: InstallTarget[],
    options: RemoveOptions,
  ): Promise<void>;

  abstract list(scope: 'global' | 'project' | 'both'): Promise<InstalledResource[]>;

  abstract validate(resource: Resource): Promise<ValidationResult>;

  abstract getSupportedAgents(): AgentType[];

  abstract getInstallPath(agent: AgentType, scope: Scope): string;

  // Optional methods with default implementations

  async checkUpdates(resources: InstalledResource[]): Promise<UpdateCheck[]> {
    // Default: no updates available
    return resources.map((resource) => ({
      resourceName: resource.name,
      currentVersion: resource.version,
      updateAvailable: false,
    }));
  }

  async update(_resource: InstalledResource, _target?: string): Promise<void> {
    throw new Error(`Update not implemented for ${this.type}`);
  }
}
