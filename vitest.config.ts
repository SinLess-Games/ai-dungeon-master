import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    include: ["tests/unit/**/*.test.ts"],
    exclude: ["tests/e2e/**", "node_modules/**"],
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "json-summary"],
      include: ["src/lib/**/*.ts"],
      exclude: [
        "src/lib/**/*.server.ts",
        "src/lib/**/*.functions.ts",
        "src/lib/cloud-sync.ts",
        "src/lib/map-art.ts",
        "src/lib/stream-image.ts",
        "src/lib/pdf-sheet.ts",
        "src/lib/error-capture.ts",
        "src/lib/lovable-error-reporting.ts",
        "src/lib/stripe.ts",
      ],
      thresholds: { lines: 80, statements: 80, functions: 70, branches: 65 },
    },
  },
});
