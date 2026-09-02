import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../src/config/redis", () => ({
	default: {
		get: vi.fn(),
		set: vi.fn(),
		del: vi.fn(),
	},
}));

const { default: redis } = await import("../src/config/redis");
const { cacheUser, invalidateUserCache, readCachedUser, userCacheKey } =
	await import("../src/util/user-cache");
const { userFixture } = await import("./fixtures");

const mockedRedis = vi.mocked(redis);

beforeEach(() => {
	vi.clearAllMocks();
});

describe("user-cache", () => {
	test("namespaces the cache key", () => {
		expect(userCacheKey("user-1")).toBe("user:user-1");
	});

	test("returns null when nothing is cached", async () => {
		mockedRedis.get.mockResolvedValueOnce(null);

		expect(await readCachedUser("user-1")).toBeNull();
	});

	test("revives date fields and nulls missing ones", async () => {
		const user = userFixture({ loginAt: null });
		mockedRedis.get.mockResolvedValueOnce(JSON.stringify(user));

		const cached = await readCachedUser(user.id);

		expect(cached?.emailVerified).toBeInstanceOf(Date);
		expect(cached?.loginAt).toBeNull();
		expect(cached?.deletedAt).toBeNull();
	});

	test("drops a corrupt cache entry", async () => {
		mockedRedis.get.mockResolvedValueOnce("{oops");

		expect(await readCachedUser("user-1")).toBeNull();
		expect(mockedRedis.del).toHaveBeenCalledWith("user:user-1");
	});

	test("returns null for a cached non-object", async () => {
		mockedRedis.get.mockResolvedValueOnce("null");

		expect(await readCachedUser("user-1")).toBeNull();
	});

	test("writes and clears cache entries", async () => {
		const user = userFixture();

		await cacheUser(user);
		expect(mockedRedis.set).toHaveBeenCalledWith(
			`user:${user.id}`,
			JSON.stringify(user),
			"EX",
			10800,
		);

		await invalidateUserCache(user.id);
		expect(mockedRedis.del).toHaveBeenCalledWith(`user:${user.id}`);
	});
});
