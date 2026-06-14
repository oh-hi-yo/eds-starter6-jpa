import { expect, test } from "@playwright/test";
import { expectOnUsers, login } from "./helpers";

test.describe("User Management", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "admin", "admin");
    await expectOnUsers(page);
  });

  test("Grid 顯示使用者資料", async ({ page }) => {
    await expect(page.getByText("登入名稱")).toBeVisible();
    await expect(page.getByText("admin", { exact: true })).toBeVisible();
  });

  test("搜尋使用者", async ({ page }) => {
    await page.getByLabel("搜尋使用者").fill("admin");
    await page.getByLabel("搜尋使用者").press("Enter");
    await expect(page.getByText("admin", { exact: true })).toBeVisible();
  });

  test("新增使用者 → 顯示成功訊息", async ({ page }) => {
    await page.getByRole("button", { name: "新增使用者" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByLabel("登入名稱").fill("newuser");
    await page.getByLabel("名", { exact: true }).fill("New");
    await page.getByLabel("姓", { exact: true }).fill("User");
    await page.getByLabel("Email").fill("newuser@example.com");
    await page.getByRole("button", { name: "儲存" }).click();
    await expect(page.getByText("已新增使用者")).toBeVisible();
  });
});
