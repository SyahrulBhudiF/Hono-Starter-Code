export function getConnInfo(): { remote: { address?: string } } {
	throw new TypeError("getConnInfo is not available in Vitest");
}
