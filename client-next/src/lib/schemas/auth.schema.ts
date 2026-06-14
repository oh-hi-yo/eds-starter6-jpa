import { z } from "zod";

export const loginSchema = z.object({
  loginName: z.string().min(1, "請輸入登入名稱"),
  password: z.string().min(1, "請輸入密碼"),
  rememberMe: z.boolean().optional(),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const otpSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, "請輸入 6 位數字驗證碼"),
});
export type OtpInput = z.infer<typeof otpSchema>;

export const resetRequestSchema = z.object({
  email: z.string().email("Email 格式不正確"),
});
export type ResetRequestInput = z.infer<typeof resetRequestSchema>;
