const testEnv: Record<string, string> = {
	NODE_ENV: "test",
	PORT: "3000",
	LOG_LEVEL: "error",
	DATABASE_URL: "postgres://postgres:postgres@localhost:5432/test",
	REDIS_HOST: "localhost",
	REDIS_PORT: "6379",
	CORS_ORIGINS: "http://localhost:3000",
	TRUST_PROXY: "false",
	MAIL_HOST: "sandbox.smtp.mailtrap.io",
	MAIL_PORT: "2525",
	MAIL_USERNAME: "test-mail-user",
	MAIL_PASSWORD: "test-mail-password",
	MAIL_FROM: "no-reply@example.com",
	JWT_ACCESS_SECRET: "test-access-secret-that-is-long-enough-000",
	JWT_REFRESH_SECRET: "test-refresh-secret-that-is-long-enough-0",
	ACCESS_TOKEN_EXPIRES_IN: "1",
	REFRESH_TOKEN_EXPIRES_IN: "7",
	GOOGLE_CLIENT_ID: "test-google-client",
	GOOGLE_CLIENT_SECRET: "test-google-secret",
	GOOGLE_REDIRECT_URI: "http://localhost:3000/api/v1/auth/google",
};

for (const [key, value] of Object.entries(testEnv)) {
	process.env[key] ??= value;
}
