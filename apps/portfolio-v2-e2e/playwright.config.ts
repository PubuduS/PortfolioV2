import {
  defineConfig,
  devices,
} from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';

const nxPreset = nxE2EPreset(__filename, { testDir: './src' });

export default defineConfig({
  ...nxPreset,
  fullyParallel: false,
  timeout: 60_000,
  globalSetup: require.resolve('./src/global-setup'),
  use: {
    baseURL: 'http://127.0.0.1:4300',
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'npm run emulators',
      url: 'http://127.0.0.1:4000',
      timeout: 180_000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npx nx serve portfolio-v2 --configuration=emulator --host=127.0.0.1 --port=4300',
      url: 'http://127.0.0.1:4300',
      timeout: 180_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
  projects: [
    {
      name: 'read',
      testMatch: '**/e2e/read/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'rules',
      testMatch: '**/e2e/rules/**/*.spec.ts',
    },
    {
      name: 'write',
      testMatch: '**/e2e/write/**/*.spec.ts',
      dependencies: ['read'],
      fullyParallel: false,
      workers: 1,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
