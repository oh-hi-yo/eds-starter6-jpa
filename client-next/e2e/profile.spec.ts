import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test.describe("Profile", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "admin", "admin");
    await expect(page).toHaveURL(/\/users/);
    await page.getByRole("menu").getByText("個人設定").click();
    await expect(page).toHaveURL(/\/profile/);
  });

  test("更新語系設定 → 儲存成功", async ({ page }) => {
    await page.getByRole("button", { name: "儲存設定" }).click();
    await expect(page.getByText("設定已儲存")).toBeVisible();
  });

  test("啟用 2FA → 顯示 QRCode", async ({ page }) => {
    await page.getByRole("tab", { name: "兩步驟驗證" }).click();
    await page.getByRole("button", { name: "啟用兩步驟驗證" }).click();
    await expect(page.getByLabel("2FA QRCode")).toBeVisible();
  });

  test("登入裝置清單顯示", async ({ page }) => {
    await page.getByRole("tab", { name: "登入裝置" }).click();
    await expect(page.getByText("Chrome / macOS")).toBeVisible();
  });
});
