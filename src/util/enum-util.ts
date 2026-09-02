export function enumToArray(
	enumObj: Record<string, string | number>,
): string[] {
	return Object.values(enumObj).filter(
		(value): value is string => typeof value === "string",
	);
}
