import { defineConfig } from 'vitest/config';

/**
 * The API e2e suite runs on Vitest rather than Jest because NestJS 12 ships
 * ES modules, which Jest's CommonJS runtime cannot load. Vitest executes the
 * same TypeScript sources natively.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.e2e-spec.ts'],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    fileParallelism: false,
    sequence: { concurrent: false },
    reporters: ['default'],
  },
});
