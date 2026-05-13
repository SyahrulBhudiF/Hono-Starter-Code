import { z } from "@hono/zod-openapi";

export class UserValidation {
	static readonly UPDATE = z.object({
		name: z.string().min(3).openapi({ example: "Jane Doe" }),
	});

	static readonly CHANGE_PASSWORD = z.object({
		oldPassword: z.string().min(6).openapi({ example: "secret123" }),
		newPassword: z.string().min(6).openapi({ example: "newsecret123" }),
	});
}
