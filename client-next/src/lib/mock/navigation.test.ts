import { describe, expect, it } from "vitest";
import { getNavigation } from "./data";

describe("getNavigation", () => {
  it("ADMIN 看到使用者管理 / 個人設定 / 系統管理", () => {
    const nav = getNavigation(["ADMIN", "USER"]);
    const keys = nav.map((n) => n.key);
    expect(keys).toEqual(["users", "profile", "system"]);
  });

  it("一般 USER 只看到個人設定（看不到使用者管理）", () => {
    const nav = getNavigation(["USER"]);
    const keys = nav.map((n) => n.key);
    expect(keys).toEqual(["profile"]);
    expect(keys).not.toContain("users");
  });
});
