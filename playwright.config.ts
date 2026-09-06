import { defineConfig, devices } from "@playwright/test";

const isCI = Boolean(process.env["CI"]);
const externalBaseUrl = process.env["E2E_BASE_URL"];

export default defineConfig({
  testDir: "./tests/e2e",

  outputDir: "./test-results/playwright",

  timeout: 60_000,

  expect: {
    timeout: 10_000,
  },

  fullyParallel: true,

  forbidOnly: isCI,

  retries: isCI ? 2 : 0,

  ...(isCI
    ? {
        workers: 1,
      }
    : {}),

  reporter: isCI
    ? [
        ["list"],
        ["html", { outputFolder: "playwright-report", open: "never" }],
      ]
    : [["list"]],

  use: {
    baseURL: externalBaseUrl ?? "http://localhost:5173",

    actionTimeout: 15_000,

    navigationTimeout: 30_000,

    trace: "retain-on-failure",

    screenshot: "only-on-failure",

    video: "retain-on-failure",

    launchOptions: {
      ...(process.env["E2E_CHROME_PATH"]
        ? {
            executablePath: process.env["E2E_CHROME_PATH"],
          }
        : {}),
    },
  },

  projects: [
    {
      name: "desktop-chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: {
          width: 1440,
          height: 1000,
        },
      },
    },

    {
      name: "mobile-chromium",
      use: {
        ...devices["Pixel 7"],
      },
    },
  ],

  ...(!externalBaseUrl
    ? {
        webServer: {
          command: "npm run dev",
          url: "http://localhost:5173",
          reuseExistingServer: !isCI,
          timeout: 120_000,
        },
      }
    : {}),
});