import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "fs";

// Check if GitHub authentication is available
const authState = existsSync("github-auth-state.json")
  ? "github-auth-state.json"
  : undefined;

export default defineConfig({
  testDir: "./src",
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["html"], ["json", { outputFile: "test-results/results.json" }]],
  outputDir: "test-results/",
  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    launchOptions: {
      args: [
        "--force-prefers-reduced-motion",
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor",
      ],
    },
    colorScheme: (process.env.COLOR_SCHEME as "light" | "dark") || "light",
    ignoreHTTPSErrors: true,
    // Don't use global authentication - we'll apply it per-test as needed
    // storageState: authState,
  },
  projects: [
    {
      name: "chromium",
      use: {
        // Use minimal browser settings similar to our working test
        channel: "chrome",
        viewport: { width: 1280, height: 720 },
        deviceScaleFactor: 3, // 3x pixel density for high-resolution screenshots
      },
    },
  ],
});
