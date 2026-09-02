import { z } from "@hono/zod-openapi";

export const AuthValidation = {
	REGISTER: z.object({
		email: z.email().openapi({ example: "user@example.com" }),
		password: z.string().min(6).openapi({ example: "secret123" }),
		name: z.string().min(3).openapi({ example: "Jane Doe" }),
	}),

	LOGIN: z.object({
		email: z.email().openapi({ example: "user@example.com" }),
		password: z.string().min(6).openapi({ example: "secret123" }),
	}),

	SEND_OTP: z.object({
		email: z.email().openapi({ example: "user@example.com" }),
	}),

	VERIFY_OTP: z.object({
		email: z.email().openapi({ example: "user@example.com" }),
		otp: z.string().length(6).openapi({ example: "123456" }),
	}),

	RESET_PASSWORD: z.object({
		email: z.email().openapi({ example: "user@example.com" }),
		password: z.string().min(6).openapi({ example: "newsecret123" }),
		otp: z.string().length(6).openapi({ example: "123456" }),
	}),
} as const;
