import { z, type ZodType } from "zod";

export class UserValidation {
	static readonly UPDATE: ZodType = z.object({
		name: z.string().min(3),
	});

	static readonly CHANGE_PASSWORD: ZodType = z.object({
		oldPassword: z.string().min(6),
		newPassword: z.string().min(6),
	});
}
