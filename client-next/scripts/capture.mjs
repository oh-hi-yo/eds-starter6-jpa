import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const OUT = process.env.OUT ?? "../.doc/screenshots";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 800 } });

async function shot(name) {
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
  console.log("captured", name);
}

// Login
await page.goto(`${BASE}/login`);
await page.waitForTimeout(500);
await shot("01-login");

// Login as admin
await page.getByLabel("登入名稱").fill("admin");
await page.getByLabel("密碼").fill("admin");
await page.getByRole("button", { name: "登入" }).click();
await page.waitForURL(/\/users/);
await page.waitForTimeout(800);
await shot("02-users-grid");

// Open create form
await page.getByRole("button", { name: "新增使用者" }).click();
await page.waitForTimeout(500);
await shot("03-user-form");
await page.keyboard.press("Escape");

// Profile → 2FA
await page.getByRole("menu").getByText("個人設定").click();
await page.waitForURL(/\/profile/);
await page.waitForTimeout(500);
await shot("04-profile-settings");
await page.getByRole("tab", { name: "兩步驟驗證" }).click();
await page.getByRole("button", { name: "啟用兩步驟驗證" }).click();
await page.waitForTimeout(600);
await shot("05-profile-2fa-qrcode");

// System
await page.getByRole("menu").getByText("系統管理").click();
await page.waitForURL(/\/system/);
await page.waitForTimeout(500);
await shot("06-system");

await browser.close();
console.log("done");
