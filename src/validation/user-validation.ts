import {z, ZodType} from "zod";

export class UserValidation {
    static readonly UPDATE: ZodType = z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(3),
    });

    static readonly CHANGE_PASSWORD: ZodType = z.object({
        oldPassword: z.string().min(6),
        newPassword: z.string().min(6),
    });
}