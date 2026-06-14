import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test.describe("Error Pages", () => {
  test("不存在路由 → 404", async ({ page }) => {
    await login(page, "admin", "admin");
    await expect(page).toHaveURL(/\/users/);
    await page.goto("/this-route-does-not-exist");
    await expect(page.getByText("404")).toBeVisible();
  });

  test("403 頁面正確呈現", async ({ page }) => {
    await login(page, "admin", "admin");
    await expect(page).toHaveURL(/\/users/);
    await page.goto("/forbidden");
    await expect(page.getByText("403")).toBeVisible();
  });
});
