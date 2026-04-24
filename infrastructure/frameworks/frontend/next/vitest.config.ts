import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const nextRoot = __dirname;
const monorepoRoot = path.resolve(nextRoot, '../../../..');

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: [path.join(nextRoot, 'src/test/setup.ts')],
    include: ['src/**/*.test.{ts,tsx}'],
    passWithNoTests: false,
  },
  resolve: {
    alias: {
      '@': path.join(nextRoot, 'src'),
      '@/domain': path.join(monorepoRoot, 'domain'),
      '@/shared': path.join(monorepoRoot, 'shared'),
      '@pictures/contracts': path.join(monorepoRoot, 'packages/contracts/index.ts'),
    },
  },
});
