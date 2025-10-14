export function requireEnv(name: string): string | number {
	const value = process.env[name];
	if (!value && name !== "REDIS_PASSWORD")
		throw new Error(`Missing environment variable: ${name}`);
	return value as string | number;
}
