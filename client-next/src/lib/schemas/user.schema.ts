import { z } from "zod";

export const userSchema = z.object({
  id: z.number().nullable().optional(),
  loginName: z.string().min(1, "請輸入登入名稱"),
  firstName: z.string().min(1, "請輸入名"),
  lastName: z.string().min(1, "請輸入姓"),
  email: z.string().email("Email 格式不正確"),
  locale: z.string().min(1, "請選擇語系"),
  enabled: z.boolean(),
  authorities: z.array(z.string()).min(1, "至少指派一個角色"),
});
export type UserInput = z.infer<typeof userSchema>;
