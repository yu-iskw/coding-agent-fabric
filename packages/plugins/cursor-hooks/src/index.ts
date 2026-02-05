/**
 * @coding-agent-fabric/plugin-cursor-hooks
 *
 * Plugin for managing Cursor hooks
 */

import type { PluginExport, PluginContext } from '@coding-agent-fabric/plugin-api';
import { CursorHooksHandler } from './handler.js';

/**
 * Plugin export
 */
const plugin: PluginExport = {
  /**
   * Create handler instance
   */
  createHandler(context: PluginContext) {
    return new CursorHooksHandler(context);
  },

  /**
   * Called when plugin is loaded
   */
  async onLoad(context: PluginContext) {
    context.log.info('Cursor Hooks plugin loaded');
  },

  /**
   * Called when plugin is unloaded
   */
  async onUnload(context: PluginContext) {
    context.log.info('Cursor Hooks plugin unloaded');
  },
};

export default plugin;
