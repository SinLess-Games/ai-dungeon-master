import { z } from "zod";
export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Use at least 3 characters.")
  .max(32, "Use at most 32 characters.")
  .regex(/^[A-Za-z0-9_-]+$/, "Use letters, numbers, underscores, or hyphens.");
export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(128, "Use at most 128 characters.");
export const signupSchema = z
  .object({
    username: usernameSchema,
    email: z.email("Enter a valid email address.").trim(),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
