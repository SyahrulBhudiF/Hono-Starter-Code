export function requireEnv<T = string>(
	name: string,
	nullableVars: string[] = [],
): T {
	const value = process.env[name];
	if (!value && !nullableVars.includes(name)) {
		throw new Error(`Missing environment variable: ${name}`);
	}

	return value as T;
}
