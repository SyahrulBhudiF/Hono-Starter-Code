import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../src/config/redis", () => ({
	default: {
		get: vi.fn(),
		set: vi.fn(),
		del: vi.fn(),
		exists: vi.fn(),
	},
}));

vi.mock("../src/repository/user-repository", () => ({
	userRepository: { findById: vi.fn() },
}));

const { default: redis } = await import("../src/config/redis");
const { userRepository } = await import("../src/repository/user-repository");
const { authMiddleware } = await import("../src/middleware/auth-middleware");
const { generateAccessToken } = await import("../src/util/jwt-util");
const { env } = await import("../src/config/env");
const { userFixture } = await import("./fixtures");

const mockedRedis = vi.mocked(redis);
const mockedRepository = vi.mocked(userRepository);

const context = (authorization?: string) => {
	const variables = new Map<string, unknown>();

	return {
		req: {
			header: (name: string) =>
				name === "Authorization" ? authorization : undefined,
		},
		set: (key: string, value: unknown) => variables.set(key, value),
		get: (key: string) => variables.get(key),
		variables,
	};
};

const middleware = authMiddleware(env.JWT_ACCESS_SECRET);

beforeEach(() => {
	vi.clearAllMocks();
	mockedRedis.exists.mockResolvedValue(0);
	mockedRedis.get.mockResolvedValue(null);
});

describe("authMiddleware", () => {
	test("rejects a request without a bearer token", async () => {
		await expect(middleware(context() as never, vi.fn())).rejects.toMatchObject(
			{ status: 401 },
		);
	});

	test("rejects an empty bearer token", async () => {
		await expect(
			middleware(context("Bearer   ") as never, vi.fn()),
		).rejects.toMatchObject({ status: 401 });
	});

	test("rejects a blacklisted token before loading the user", async () => {
		const token = await generateAccessToken(userFixture());
		mockedRedis.exists.mockResolvedValueOnce(1);

		await expect(
			middleware(context(`Bearer ${token}`) as never, vi.fn()),
		).rejects.toThrow("Token has been invalidated");

		expect(mockedRepository.findById).not.toHaveBeenCalled();
	});

	test("rejects a token whose user no longer exists", async () => {
		const token = await generateAccessToken(userFixture());
		mockedRepository.findById.mockResolvedValueOnce(null);

		await expect(
			middleware(context(`Bearer ${token}`) as never, vi.fn()),
		).rejects.toMatchObject({ status: 404 });
	});

	test("loads the user from the database and caches it once", async () => {
		const user = userFixture();
		const token = await generateAccessToken(user);
		mockedRepository.findById.mockResolvedValueOnce(user);

		const c = context(`Bearer ${token}`);
		const next = vi.fn();
		await middleware(c as never, next);

		expect(next).toHaveBeenCalled();
		expect(c.get("user")).toEqual(user);
		expect(c.get("token")).toBe(token);
		expect(mockedRedis.set).toHaveBeenCalledTimes(1);
	});

	test("reuses the cached user with revived dates and skips a rewrite", async () => {
		const user = userFixture();
		const token = await generateAccessToken(user);
		mockedRedis.get.mockResolvedValueOnce(JSON.stringify(user));

		const c = context(`Bearer ${token}`);
		await middleware(c as never, vi.fn());

		const cached = c.get("user") as typeof user;
		expect(cached.emailVerified).toBeInstanceOf(Date);
		expect(cached.createdAt).toBeInstanceOf(Date);
		expect(mockedRepository.findById).not.toHaveBeenCalled();
		expect(mockedRedis.set).not.toHaveBeenCalled();
	});

	test("falls back to the database when the cached value is corrupt", async () => {
		const user = userFixture();
		const token = await generateAccessToken(user);
		mockedRedis.get.mockResolvedValueOnce("not-json");
		mockedRepository.findById.mockResolvedValueOnce(user);

		await middleware(context(`Bearer ${token}`) as never, vi.fn());

		expect(mockedRedis.del).toHaveBeenCalledWith(`user:${user.id}`);
		expect(mockedRepository.findById).toHaveBeenCalled();
	});

	test("rejects a user whose role does not match", async () => {
		const user = userFixture();
		const token = await generateAccessToken(user);
		mockedRepository.findById.mockResolvedValueOnce(user);

		await expect(
			authMiddleware(env.JWT_ACCESS_SECRET, "ADMIN")(
				context(`Bearer ${token}`) as never,
				vi.fn(),
			),
		).rejects.toMatchObject({ status: 403 });
	});
});
