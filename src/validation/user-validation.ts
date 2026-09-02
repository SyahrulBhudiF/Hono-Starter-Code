import { z } from "@hono/zod-openapi";

export const UserValidation = {
	UPDATE: z.object({
		name: z.string().min(3).openapi({ example: "Jane Doe" }),
	}),

	CHANGE_PASSWORD: z.object({
		oldPassword: z.string().min(6).optional().openapi({ example: "secret123" }),
		newPassword: z.string().min(6).openapi({ example: "newsecret123" }),
	}),
} as const;
