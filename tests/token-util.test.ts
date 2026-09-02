import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../src/config/redis", () => ({
	default: {
		set: vi.fn(),
		exists: vi.fn(),
	},
}));

const { default: redis } = await import("../src/config/redis");
const {
	blacklistKey,
	blacklistToken,
	getTokenExpiresIn,
	getTokenId,
	getTokenSubject,
	isTokenBlacklisted,
} = await import("../src/util/token-util");

const mockedRedis = vi.mocked(redis);

beforeEach(() => {
	vi.clearAllMocks();
});

describe("token-util", () => {
	test("builds a namespaced blacklist key", () => {
		expect(blacklistKey("abc")).toBe("blacklist:abc");
	});

	test("rejects payloads without a token id or subject", () => {
		expect(() => getTokenId({})).toThrow();
		expect(() => getTokenSubject({ jti: "abc" })).toThrow();
	});

	test("reads the token id and subject", () => {
		expect(getTokenId({ jti: "abc" })).toBe("abc");
		expect(getTokenSubject({ id: "user-1" })).toBe("user-1");
	});

	test("computes a remaining lifetime of at least one second", () => {
		const past = Math.floor(Date.now() / 1000) - 100;
		const future = Math.floor(Date.now() / 1000) + 100;

		expect(getTokenExpiresIn({ exp: past })).toBe(1);
		expect(getTokenExpiresIn({ exp: future })).toBeGreaterThan(90);
		expect(() => getTokenExpiresIn({})).toThrow();
	});

	test("reports whether a token id is blacklisted", async () => {
		mockedRedis.exists.mockResolvedValueOnce(1);
		expect(await isTokenBlacklisted("abc")).toBe(true);

		mockedRedis.exists.mockResolvedValueOnce(0);
		expect(await isTokenBlacklisted("abc")).toBe(false);
	});

	test("writes blacklist entries with and without NX", async () => {
		mockedRedis.set.mockResolvedValue("OK");

		expect(await blacklistToken("abc", 60)).toBe(true);
		expect(mockedRedis.set).toHaveBeenLastCalledWith(
			"blacklist:abc",
			"1",
			"EX",
			60,
		);

		expect(await blacklistToken("abc", 60, true)).toBe(true);
		expect(mockedRedis.set).toHaveBeenLastCalledWith(
			"blacklist:abc",
			"1",
			"EX",
			60,
			"NX",
		);

		mockedRedis.set.mockResolvedValueOnce(null);
		expect(await blacklistToken("abc", 60, true)).toBe(false);
	});
});
