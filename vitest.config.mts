import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
      // `server-only` throws unless it is imported from a React Server
      // Component. Vitest is neither, so it is stubbed here. The guarantee it
      // provides still holds where it matters: Next enforces it at build time.
      'server-only': new URL('./tests/stubs/server-only.ts', import.meta.url).pathname,
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    fileParallelism: false,
  },
});
