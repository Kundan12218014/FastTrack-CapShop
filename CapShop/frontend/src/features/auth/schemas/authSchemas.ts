import { z } from "zod";

/**
 * Zod schemas are used with React Hook Form's zodResolver.
 *
 * Why Zod over manual validation?
 *  - Type-safe: TypeScript infers the form data type from the schema
 *  - Declarative: validation rules read like documentation
 *  - Consistent: same password rules as the FluentValidation backend validators
 *
 * These schemas must mirror the server-side validators in
 * CapShop.AuthService/Application/Validators/AuthValidators.cs
 */

export const signupSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters.")
    .max(100, "Full name must be at most 100 characters.")
    .regex(
      /^[a-zA-Z\s'-]+$/,
      "Full name can only contain letters, spaces, hyphens, and apostrophes.",
    ),

  email: z
    .string()
    .min(1, "Email is required.")
    .email("Please enter a valid email address.")
    .max(200),

  phoneNumber: z
    .string()
    .regex(/^\d{10}$/, "Phone number must be exactly 10 digits."),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
    .regex(/[0-9]/, "Password must contain at least one digit.")
    .regex(
      /[^a-zA-Z0-9]/,
      "Password must contain at least one special character.",
    ),
});

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required.")
    .email("Please enter a valid email address."),

  password: z.string().min(1, "Password is required."),
});

// Infer TypeScript types from schemas — used to type useForm<T>()
export type SignupFormValues = z.infer<typeof signupSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
