import { describe, expect, it } from "vitest";
import { userSchema } from "./user.schema";

const valid = {
  id: null,
  loginName: "alice",
  firstName: "Alice",
  lastName: "Chen",
  email: "alice@example.com",
  locale: "zh-TW",
  enabled: true,
  authorities: ["USER"],
};

describe("userSchema", () => {
  it("accepts a valid user", () => {
    expect(userSchema.safeParse(valid).success).toBe(true);
  });
  it("rejects invalid email", () => {
    expect(userSchema.safeParse({ ...valid, email: "bad" }).success).toBe(false);
  });
  it("rejects empty required fields", () => {
    expect(userSchema.safeParse({ ...valid, firstName: "" }).success).toBe(false);
    expect(userSchema.safeParse({ ...valid, loginName: "" }).success).toBe(false);
  });
  it("requires at least one authority", () => {
    expect(userSchema.safeParse({ ...valid, authorities: [] }).success).toBe(false);
  });
});
