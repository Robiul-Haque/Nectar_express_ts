import z from "zod";

const passwordSchema = z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .regex(/[A-Z]/, "Password must contain at least one capital letter")
    .regex(/[a-z]/, "Password must contain at least one small letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

export const emailRegisterSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: passwordSchema,
    role: z.enum(["user", "admin"]).optional(),
});

export const otpVerifySchema = z.object({
    email: z.email(),
    otp: z.string().length(4),
});

export const emailLoginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: passwordSchema,
});

export const googleLoginSchema = z.object({
    idToken: z.string(),
});

export const facebookLoginSchema = z.object({
    accessToken: z.string(),
});