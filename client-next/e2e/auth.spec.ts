import { expect, test } from "@playwright/test";
import { expectOnUsers, fillOtp, login } from "./helpers";

test.describe("Authentication", () => {
  test("正確帳密登入 → 進入使用者管理", async ({ page }) => {
    await login(page, "admin", "admin");
    await expectOnUsers(page);
  });

  test("錯誤密碼 → 顯示錯誤訊息", async ({ page }) => {
    await login(page, "admin", "wrong-password");
    await expect(page.getByText("登入名稱或密碼錯誤")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("2FA 使用者 → 導向 2FA 頁並驗證成功", async ({ page }) => {
    await login(page, "mfauser", "admin");
    await expect(page).toHaveURL(/\/login\/2fa/);
    await fillOtp(page, "123456");
    await page.getByRole("button", { name: "驗證" }).click();
    await expectOnUsers(page);
  });

  test("登出 → 回到登入頁", async ({ page }) => {
    await login(page, "admin", "admin");
    await expectOnUsers(page);
    await page.getByRole("button", { name: "登出" }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});
