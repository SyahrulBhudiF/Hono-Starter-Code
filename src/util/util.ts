export function requireEnv(name: string, nullableVars: string[] = []): string | number {
	const value = process.env[name];
	if (!value && !nullableVars.includes(name))
		throw new Error(`Missing environment variable: ${name}`);
	return value as string | number;
}
