import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },

  test: {
    /**
     * Most Endless Codex unit tests should run without a browser.
     *
     * React/component tests that require a DOM can opt into jsdom with:
     *
     * @vitest-environment jsdom
     */
    environment: "node",

    include: [
      "tests/unit/**/*.test.ts",
      "tests/unit/**/*.test.tsx",
    ],

    exclude: [
      "node_modules/**",
      "dist/**",
      "old/**",
      "tests/e2e/**",
    ],

    clearMocks: true,
    restoreMocks: true,

    coverage: {
      provider: "v8",

      reporter: [
        "text",
        "text-summary",
        "json-summary",
        "lcov",
      ],

      /**
       * Measure actual application/domain logic.
       *
       * UI and routing are better exercised through component
       * and Playwright tests rather than driving unit coverage
       * percentages with rendering code.
       */
      include: [
        "src/engine/**/*.{ts,tsx}",
        "src/rulesets/**/*.{ts,tsx}",
        "src/modules/**/*.{ts,tsx}",
        "src/server/**/*.{ts,tsx}",
        "src/infrastructure/**/*.{ts,tsx}",
        "src/shared/**/*.{ts,tsx}",
      ],

      exclude: [
        "**/*.d.ts",
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/*.spec.ts",
        "**/*.spec.tsx",

        "src/**/*.gen.ts",
        "src/routeTree.gen.ts",

        "src/routes/**",
        "src/ui/**",
        "src/styles/**",
        "src/assets/**",

        "src/platform/**",

        "src/**/index.ts",
      ],

      thresholds: {
        lines: 80,
        statements: 80,
        functions: 75,
        branches: 70,
      },
    },
  },
});