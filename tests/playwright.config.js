import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  reporter: 'list',
  // Short timeouts on purpose: if something isn't on the page yet, we'd rather
  // tell you in a couple of seconds than make you wait half a minute.
  timeout: 10000,
  expect: { timeout: 2000 },
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://localhost:4174',
    actionTimeout: 2000,
  },
  webServer: {
    command: 'node serve.js',
    url: 'http://localhost:4174/index.html',
    reuseExistingServer: !process.env.CI,
    timeout: 15000,
  },
});
