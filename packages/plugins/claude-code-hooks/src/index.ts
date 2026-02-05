/**
 * @coding-agent-fabric/plugin-claude-code-hooks
 *
 * Plugin for managing Claude Code hooks (PreToolUse, PostToolUse)
 */

import type { PluginExport, PluginContext } from '@coding-agent-fabric/plugin-api';
import { ClaudeCodeHooksHandler } from './handler.js';

/**
 * Plugin export
 */
const plugin: PluginExport = {
  /**
   * Create handler instance
   */
  createHandler(context: PluginContext) {
    return new ClaudeCodeHooksHandler(context);
  },

  /**
   * Called when plugin is loaded
   */
  async onLoad(context: PluginContext) {
    context.log.info('Claude Code Hooks plugin loaded');
  },

  /**
   * Called when plugin is unloaded
   */
  async onUnload(context: PluginContext) {
    context.log.info('Claude Code Hooks plugin unloaded');
  },
};

export default plugin;
