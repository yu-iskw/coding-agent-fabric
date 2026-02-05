import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  test: {
    alias: {
      '@coding-agent-fabric/common': resolve(__dirname, './packages/common/src/index.ts'),
      '@coding-agent-fabric/core': resolve(__dirname, './packages/core/src/index.ts'),
      '@coding-agent-fabric/plugin-api': resolve(__dirname, './packages/plugin-api/src/index.ts'),
    },
    include: ['packages/**/src/**/*.{test,spec}.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '.trunk'],
  },
});
