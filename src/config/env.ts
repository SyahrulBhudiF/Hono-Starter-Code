import { z } from "zod";

const optionalString = z
	.string()
	.optional()
	.transform((value) => (value && value.length > 0 ? value : undefined));

const booleanString = z
	.enum(["true", "false"])
	.default("false")
	.transform((value) => value === "true");

const envSchema = z.object({
	NODE_ENV: z
		.enum(["development", "test", "production"])
		.default("development"),
	PORT: z.coerce.number().int().positive().default(3000),
	LOG_LEVEL: z
		.enum(["error", "warn", "info", "http", "verbose", "debug", "silly"])
		.default("info"),

	DATABASE_URL: z.string().min(1),

	REDIS_HOST: z.string().min(1),
	REDIS_PORT: z.coerce.number().int().positive(),
	REDIS_PASSWORD: optionalString,

	CORS_ORIGINS: z.string().default(""),
	TRUST_PROXY: booleanString,
	BODY_LIMIT_BYTES: z.coerce
		.number()
		.int()
		.positive()
		.default(1024 * 100),

	MAIL_SERVICE: optionalString,
	MAIL_HOST: z.string().min(1),
	MAIL_PORT: z.coerce.number().int().positive(),
	MAIL_USERNAME: z.string().min(1),
	MAIL_PASSWORD: z.string().min(1),
	MAIL_FROM: z.string().min(1),

	JWT_ACCESS_SECRET: z.string().min(32),
	JWT_REFRESH_SECRET: z.string().min(32),
	ACCESS_TOKEN_EXPIRES_IN: z.coerce.number().int().positive(),
	REFRESH_TOKEN_EXPIRES_IN: z.coerce.number().int().positive(),

	GOOGLE_CLIENT_ID: z.string().min(1),
	GOOGLE_CLIENT_SECRET: z.string().min(1),
	GOOGLE_REDIRECT_URI: optionalString,
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
	const result = envSchema.safeParse(process.env);

	if (!result.success) {
		const details = result.error.issues
			.map((issue) => `${issue.path.join(".")}: ${issue.message}`)
			.join("\n  ");

		throw new Error(`Invalid environment configuration:\n  ${details}`);
	}

	return result.data;
}

export const env = loadEnv();

export const corsOrigins = env.CORS_ORIGINS.split(",")
	.map((origin) => origin.trim())
	.filter((origin) => origin.length > 0);

export const isProduction = env.NODE_ENV === "production";
