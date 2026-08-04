export const password = {
	async hash(): Promise<string> {
		throw new Error("Password hashing is not available in Vitest");
	},
	async verify(): Promise<boolean> {
		throw new Error("Password verification is not available in Vitest");
	},
	hashSync(): string {
		throw new Error("Password hashing is not available in Vitest");
	},
};
