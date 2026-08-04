import { HTTPException } from "hono/http-exception";
import { describe, expect, test, vi } from "vitest";
import { logger } from "../src/config/logging";
import { requestLogger } from "../src/middleware/request-logger";

const context = () =>
	({
		get: () => "req-123",
		header: () => {},
		req: { method: "POST", path: "/api/v1/auth/login" },
		res: { status: 200 },
	}) as never;

describe("requestLogger", () => {
	test("logs the real status when the handler throws an HTTPException", async () => {
		const infoSpy = vi.spyOn(logger, "info");
		const next = vi
			.fn()
			.mockRejectedValue(
				new HTTPException(429, { message: "Too many requests" }),
			);

		await expect(requestLogger()(context(), next)).rejects.toThrow(
			HTTPException,
		);

		expect(infoSpy).toHaveBeenCalledWith(
			expect.stringContaining('"status":429'),
		);
		infoSpy.mockRestore();
	});

	test("logs the status of a successful request", async () => {
		const infoSpy = vi.spyOn(logger, "info");

		await requestLogger()(context(), vi.fn());

		expect(infoSpy).toHaveBeenCalledWith(
			expect.stringContaining('"status":200'),
		);
		infoSpy.mockRestore();
	});
});
