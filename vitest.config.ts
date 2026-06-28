import { defineConfig } from 'vitest/config';

// Domain logic and progress persistence are tested in a jsdom environment so
// that browser APIs (localStorage) are available. The Phaser game layer is NOT
// unit-tested here — it is covered by Playwright e2e — which keeps unit tests
// fast and free of canvas/WebGL requirements.
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'e2e'],
    globals: false,
    clearMocks: true,
    restoreMocks: true,
  },
});
