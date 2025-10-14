import { z, type ZodType } from "zod";

export class AuthValidation {
	static readonly REGISTER: ZodType = z.object({
		email: z.string().email(),
		password: z.string().min(6),
		name: z.string().min(3),
	});

	static readonly LOGIN: ZodType = z.object({
		email: z.string().email(),
		password: z.string().min(6),
	});

	static readonly SEND_OTP: ZodType = z.object({
		email: z.string().email(),
	});

	static readonly VERIFY_OTP: ZodType = z.object({
		email: z.string().email(),
		otp: z.string().length(6),
	});

	static readonly RESET_PASSWORD: ZodType = z.object({
		email: z.string().email(),
		password: z.string().min(6),
		otp: z.string().length(6),
	});
}
