import { describe, expect, test, vi } from "vitest";

vi.mock("../src/config/redis", () => ({ default: {} }));

import { getClientIp } from "../src/middleware/rate-limit";

type Context = Parameters<typeof getClientIp>[0];

const context = (forwardedFor?: string) =>
	({
		req: {
			header: (name: string) =>
				name === "x-forwarded-for" ? forwardedFor : undefined,
		},
	}) as Context;

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
