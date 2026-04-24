import path from 'node:path';
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

const monorepoRoot = path.resolve(__dirname, '../../..');

export default defineConfig({
  plugins: [
    swc.vite({
      jsc: {
        parser: { syntax: 'typescript', decorators: true, dynamicImport: true },
        transform: { legacyDecorator: true, decoratorMetadata: true },
        target: 'es2022',
        keepClassNames: true,
      },
      module: { type: 'es6' },
    }),
  ],
  test: {
    environment: 'node',
    setupFiles: [path.join(__dirname, 'test/setup-reflect-metadata.ts')],
    // Globs must use forward slashes so Vitest finds files on Windows.
    include: [
      '../../../application/**/*.spec.ts',
      '../../../domain/**/*.spec.ts',
      'test/**/*.integration.spec.ts',
    ],
    passWithNoTests: false,
  },
  resolve: {
    alias: {
      '@': monorepoRoot,
      '@/domain': path.join(monorepoRoot, 'domain'),
      '@/application': path.join(monorepoRoot, 'application'),
      '@/infrastructure': path.join(monorepoRoot, 'infrastructure'),
      '@/shared': path.join(monorepoRoot, 'shared'),
    },
  },
});
