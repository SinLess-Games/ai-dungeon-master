import { z } from "zod";
export const feedbackSchema = z.object({
  type: z.enum(["bug", "feature"]),
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(10).max(5000),
  details: z.string().trim().max(3000).default(""),
});
