import { expect, type Page } from "@playwright/test";

/** 帳密登入（admin/admin 預設，無 2FA）。 */
export async function login(page: Page, loginName = "admin", password = "admin") {
  await page.goto("/login");
  await page.getByLabel("登入名稱").fill(loginName);
  await page.getByLabel("密碼").fill(password);
  await page.getByRole("button", { name: "登入" }).click();
}

/** 在 antd Input.OTP 輸入驗證碼。 */
export async function fillOtp(page: Page, code = "123456") {
  await page.getByRole("textbox").first().click();
  await page.keyboard.type(code);
}

export async function expectOnUsers(page: Page) {
  await expect(page).toHaveURL(/\/users/);
  await expect(page.getByRole("heading", { name: "使用者管理" })).toBeVisible();
}
