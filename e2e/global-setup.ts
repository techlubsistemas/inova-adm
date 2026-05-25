/**
 * Global setup — roda 1x antes de toda a suíte.
 * Faz login na UI e salva o storageState para os testes reusarem.
 */

import { chromium, type FullConfig } from "@playwright/test";
import { login } from "./helpers/auth";
import * as path from "path";
import * as fs from "fs";

const STATE_PATH = path.join(__dirname, ".auth-state.json");

async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL ?? "http://localhost:3000";
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();
  try {
    await login(page);
    await context.storageState({ path: STATE_PATH });
  } finally {
    await browser.close();
  }
}

export const AUTH_STATE_PATH = STATE_PATH;
export default globalSetup;

// Apaga estado anterior antes de cada run (evita usar token expirado)
if (fs.existsSync(STATE_PATH)) {
  try {
    fs.unlinkSync(STATE_PATH);
  } catch {
    /* ignore */
  }
}
