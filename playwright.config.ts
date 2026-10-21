import { defineConfig, devices } from '@playwright/test'

const PORT = 4173
// Set E2E_BASE_URL (e.g. the deployed GitHub Pages URL) to test a live site instead of a local build.
const LIVE_URL = process.env.E2E_BASE_URL

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  reporter: 'list',
  use: { baseURL: LIVE_URL ?? `http://localhost:${PORT}` },
  webServer: LIVE_URL
    ? undefined
    : {
        command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
})
