/**
 * @coding-agent-fabric/plugin-mcp
 *
 * Plugin for managing Model Context Protocol (MCP) servers
 */

import type { PluginExport, PluginContext } from '@coding-agent-fabric/plugin-api';
import { MCPHandler } from './handler.js';

/**
 * Plugin export
 */
const plugin: PluginExport = {
  /**
   * Create handler instance
   */
  createHandler(context: PluginContext) {
    return new MCPHandler(context);
  },

  /**
   * Called when plugin is loaded
   */
  async onLoad(context: PluginContext) {
    context.log.info('MCP plugin loaded');
  },

  /**
   * Called when plugin is unloaded
   */
  async onUnload(context: PluginContext) {
    context.log.info('MCP plugin unloaded');
  },
};

export default plugin;
