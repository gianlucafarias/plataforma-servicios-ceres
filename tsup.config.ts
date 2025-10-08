import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['scripts/worker.ts', 'scripts/queues-ui.ts'],
  format: ['cjs'],
  outDir: 'dist/scripts',
  dts: false,
  clean: true,
  sourcemap: false,
  minify: false,
  target: 'es2017',
});