import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  outputDir: 'test-results/',
  use: {
    baseURL: 'https://github.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    launchOptions: { 
      args: ['--force-prefers-reduced-motion'] 
    },
    colorScheme: (process.env.COLOR_SCHEME as 'light' | 'dark') || 'light',
    ignoreHTTPSErrors: true,
    // Uncomment when you have authentication set up
    // storageState: 'storageState.json',
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Override viewport - we'll set this per test
        viewport: null
      },
    },
  ],
});