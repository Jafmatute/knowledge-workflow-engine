import { z } from 'zod';

export const getAppInfoInputSchema = z.object({}).strict();
export type GetAppInfoInput = z.infer<typeof getAppInfoInputSchema>;

export const appInfoSchema = z
  .object({
    version: z.string().min(1),
  })
  .strict();
export type AppInfo = z.infer<typeof appInfoSchema>;
