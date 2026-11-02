import { defineConfig, configDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    include: ['test/**/*.test.ts'],
    exclude: [
      ...configDefaults.exclude,
      'test/types/**'
    ]
  }
});