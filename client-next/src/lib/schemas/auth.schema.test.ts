import { describe, expect, it } from "vitest";
import { loginSchema, otpSchema, resetRequestSchema } from "./auth.schema";

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    expect(loginSchema.safeParse({ loginName: "admin", password: "admin" }).success).toBe(true);
  });
  it("rejects empty loginName", () => {
    expect(loginSchema.safeParse({ loginName: "", password: "x" }).success).toBe(false);
  });
  it("rejects empty password", () => {
    expect(loginSchema.safeParse({ loginName: "admin", password: "" }).success).toBe(false);
  });
});

describe("otpSchema", () => {
  it("accepts 6 digits", () => {
    expect(otpSchema.safeParse({ otp: "123456" }).success).toBe(true);
  });
  it("rejects non-6-digit", () => {
    expect(otpSchema.safeParse({ otp: "123" }).success).toBe(false);
    expect(otpSchema.safeParse({ otp: "abcdef" }).success).toBe(false);
  });
});

describe("resetRequestSchema", () => {
  it("accepts valid email", () => {
    expect(resetRequestSchema.safeParse({ email: "a@b.com" }).success).toBe(true);
  });
  it("rejects invalid email", () => {
    expect(resetRequestSchema.safeParse({ email: "nope" }).success).toBe(false);
  });
});
