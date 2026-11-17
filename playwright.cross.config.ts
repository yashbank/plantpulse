import { defineConfig, devices } from '@playwright/test';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.e2e' });

/** Cross-browser run of the premium-pilot UI spec only. Local server only (the spec refuses anything else). */
export default defineConfig({
  testDir: './e2e/golive',
  testMatch: /premium-pilot\.spec\.ts/,
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: [['list']],
  use: { baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000', trace: 'retain-on-failure' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
