import { z } from "zod";

export const settingsSchema = z.object({
  locale: z.string().min(1, "請選擇語系"),
});
export type SettingsInput = z.infer<typeof settingsSchema>;
