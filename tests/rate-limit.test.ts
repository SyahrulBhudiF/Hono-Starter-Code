import { HTTPException } from "hono/http-exception";
import { describe, expect, test, vi } from "vitest";
import redis from "../src/config/redis";
import { getClientIp, rateLimit } from "../src/middleware/rate-limit";

vi.mock("../src/config/redis", () => ({
	default: {
		expire: vi.fn(),
		incr: vi.fn(),
		ttl: vi.fn(),
	},
}));

const mockedRedis = vi.mocked(redis);

type Context = Parameters<typeof getClientIp>[0];

const context = (forwardedFor?: string) =>
	({
		req: {
			path: "/api/v1/auth/login",
			header: (name: string) =>
				name === "x-forwarded-for" ? forwardedFor : undefined,
		},
	}) as Context;

const run = async (count: number, ttl: number) => {
	mockedRedis.incr.mockResolvedValueOnce(count);
	mockedRedis.ttl.mockResolvedValueOnce(ttl);

	const next = vi.fn();
	const setHeader = vi.fn();
	const c = { ...context(), header: setHeader } as never;

	const result = rateLimit(10, 60)(c, next);
	return { result, next, setHeader };
};

describe("getClientIp", () => {
	test("ignores forwarded client IPs unless the proxy is trusted", () => {
		process.env.TRUST_PROXY = "false";

		expect(getClientIp(context("198.51.100.10"))).toBe("unknown");
	});

	test("uses the first forwarded IP when the proxy is trusted", () => {
		process.env.TRUST_PROXY = "true";

		expect(getClientIp(context("198.51.100.10, 10.0.0.1"))).toBe(
			"198.51.100.10",
		);

		process.env.TRUST_PROXY = "false";
	});
});

describe("rateLimit", () => {
	test("sets an expiry on a key that has none", async () => {
		mockedRedis.expire.mockResolvedValueOnce(1);

		const { result, next } = await run(1, -1);

		await result;
		expect(mockedRedis.expire).toHaveBeenCalledWith(
			expect.stringContaining("rate-limit"),
			60,
		);
		expect(next).toHaveBeenCalled();
	});

	test("allows requests under the limit", async () => {
		const { result, next } = await run(2, 45);

		await result;
		expect(next).toHaveBeenCalled();
	});

	test("rejects requests over the limit with a retry delay", async () => {
		const { result, setHeader } = await run(11, 30);

		await expect(result).rejects.toThrow(HTTPException);
		expect(setHeader).toHaveBeenCalledWith("Retry-After", "30");
	});
});
