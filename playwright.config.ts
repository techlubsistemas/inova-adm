import { defineConfig, devices } from "@playwright/test";
import * as path from "path";

const AUTH_STATE = path.join(__dirname, "e2e", ".auth-state.json");

/**
 * Playwright config — E2E tests para os fluxos do porte de cadastros.
 *
 * Para rodar:
 *   E2E_EMAIL=admin@alpha.com E2E_PASSWORD='Senha@123' npm run test:e2e
 *
 * Pré-requisitos:
 *   - API rodando em :3333
 *   - inova-adm rodando em :3000
 *   - DB com seed mínimo (admin + 1 empresa + lookups básicos)
 *
 * Para debugar visualmente, use `--headed` (abre o navegador) e/ou `--ui`.
 */
export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false, // tests criam/editam dados — rodam em série
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1, // série
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: AUTH_STATE,
      },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
