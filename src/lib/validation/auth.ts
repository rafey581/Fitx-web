import { z } from "zod";

import { Role } from "@/generated/prisma/enums";

export const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export const forgotPasswordSchema = z.object({
  email: z.email("Enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(10),
    password: z
      .string()
      .min(8, "Use at least 8 characters")
      .max(200, "Password is too long"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const createUserSchema = z.object({
  name: z.string().min(2, "Enter a name").max(120),
  email: z.email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Use at least 8 characters")
    .max(200, "Password is too long"),
  role: z.enum([Role.OWNER, Role.EDITOR, Role.FRONTDESK]),
});

export const updateUserSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2, "Enter a name").max(120),
  email: z.email("Enter a valid email address"),
  role: z.enum([Role.OWNER, Role.EDITOR, Role.FRONTDESK]),
  isActive: z.boolean(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
