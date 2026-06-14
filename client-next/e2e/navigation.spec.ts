import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test.describe("Navigation", () => {
  test("ADMIN 看到使用者管理 / 系統管理選單", async ({ page }) => {
    await login(page, "admin", "admin");
    await expect(page).toHaveURL(/\/users/);
    const menu = page.getByRole("menu");
    await expect(menu.getByText("使用者管理")).toBeVisible();
    await expect(menu.getByText("系統管理")).toBeVisible();
    await expect(menu.getByText("個人設定")).toBeVisible();
  });

  test("一般 USER 看不到使用者管理選單", async ({ page }) => {
    await login(page, "david3", "david3");
    await expect(page).toHaveURL(/\/profile/);
    const menu = page.getByRole("menu");
    await expect(menu.getByText("個人設定")).toBeVisible();
    await expect(menu.getByText("使用者管理")).toHaveCount(0);
  });
});
