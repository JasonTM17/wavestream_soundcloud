import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
      "@wavestream/shared": fileURLToPath(new URL("../../packages/shared/src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["e2e/**", "node_modules/**", ".next/**", "test-results/**"],
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    minWorkers: 1,
    maxWorkers: 1,
  },
});
