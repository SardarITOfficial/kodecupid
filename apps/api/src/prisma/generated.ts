/**
 * Single import surface for the generated Prisma client.
 *
 * Prisma 7 emits plain TypeScript into `src/generated/prisma`. Keeping every
 * import behind this barrel means a generator change touches one file only.
 */
export * from '../generated/prisma/client';
export type * from '../generated/prisma/models';
