export function requireEnv(name: string): string;
export function requireEnv(
	name: string,
	nullableVars: string[],
): string | undefined;
export function requireEnv(
	name: string,
	nullableVars: string[] = [],
): string | undefined {
	const value = process.env[name];

	if (!value && !nullableVars.includes(name)) {
		throw new Error(`Missing environment variable: ${name}`);
	}

	return value;
}
