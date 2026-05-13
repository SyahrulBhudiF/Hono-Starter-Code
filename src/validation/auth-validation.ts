import { z } from "@hono/zod-openapi";

export class AuthValidation {
	static readonly REGISTER = z.object({
		email: z.email().openapi({ example: "user@example.com" }),
		password: z.string().min(6).openapi({ example: "secret123" }),
		name: z.string().min(3).openapi({ example: "Jane Doe" }),
	});

	static readonly LOGIN = z.object({
		email: z.email().openapi({ example: "user@example.com" }),
		password: z.string().min(6).openapi({ example: "secret123" }),
	});

	static readonly SEND_OTP = z.object({
		email: z.email().openapi({ example: "user@example.com" }),
	});

	static readonly VERIFY_OTP = z.object({
		email: z.email().openapi({ example: "user@example.com" }),
		otp: z.string().length(6).openapi({ example: "123456" }),
	});

	static readonly RESET_PASSWORD = z.object({
		email: z.email().openapi({ example: "user@example.com" }),
		password: z.string().min(6).openapi({ example: "newsecret123" }),
		otp: z.string().length(6).openapi({ example: "123456" }),
	});
}
