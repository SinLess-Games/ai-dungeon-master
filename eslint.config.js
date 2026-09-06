import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "coverage/**",

      ".wrangler/**",
      ".vite/**",

      "playwright-report/**",
      "test-results/**",

      "old/**",

      "android/**",
      "src-tauri/**",

      "src/routeTree.gen.ts",

      "drizzle/meta/**"
    ],
  },

  js.configs.recommended,

  ...tseslint.configs.recommended,

  {
    files: ["**/*.{ts,tsx}"],

    languageOptions: {
      ecmaVersion: "latest",

      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },

    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "old/**",
                "**/old/**"
              ],
              message:
                "Do not import legacy code from old/. Migrate the code into the new architecture first.",
            },
          ],
        },
      ],
    },
  },

  {
    files: ["**/*.tsx"],

    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },

    rules: {
      ...reactHooks.configs.recommended.rules,

      "react-refresh/only-export-components": [
        "warn",
        {
          allowConstantExport: true,
        },
      ],
    },
  },

  {
    files: [
      "*.config.js",
      "*.config.ts",
      "scripts/**/*.{js,mjs,ts}",
      "utils/**/*.{js,ts}",
      "lib/**/*.{js,ts}"
    ],

    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
  },

  {
    files: ["src/engine/**/*.{ts,tsx}"],

    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "react",
              message:
                "The generic engine must not depend on React.",
            },
            {
              name: "react-dom",
              message:
                "The generic engine must not depend on React DOM.",
            },
            {
              name: "hono",
              message:
                "The generic engine must not depend on Hono.",
            },
            {
              name: "drizzle-orm",
              message:
                "The generic engine must not depend on Drizzle.",
            },
            {
              name: "ai",
              message:
                "The generic engine must not depend on the AI SDK.",
            },
          ],

          patterns: [
            {
              group: [
                "old/**",
                "**/old/**"
              ],
              message:
                "Do not import legacy code from old/.",
            },
            {
              group: [
                "@/infrastructure/**",
                "@infrastructure/**"
              ],
              message:
                "The generic engine must not depend on infrastructure.",
            },
            {
              group: [
                "@/server/**",
                "@server/**"
              ],
              message:
                "The generic engine must not depend on the server layer.",
            },
            {
              group: [
                "@/modules/**",
                "@modules/**"
              ],
              message:
                "The generic engine must not depend on application modules.",
            },
            {
              group: [
                "@/rulesets/**",
                "@rulesets/**"
              ],
              message:
                "Rulesets depend on the engine; the engine must never depend on a ruleset.",
            },
            {
              group: [
                "@ai-sdk/**"
              ],
              message:
                "The generic engine must not depend on an AI provider or SDK.",
            },
          ],
        },
      ],
    },
  },

  eslintConfigPrettier,
);