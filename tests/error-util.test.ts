import { HTTPException } from "hono/http-exception";
import { describe, expect, test, vi } from "vitest";
import { z } from "zod";

vi.mock("../src/config/logging", () => ({
	logger: { error: vi.fn() },
}));

const { default: errorUtil } = await import("../src/util/error-util");

function context() {
	const status = vi.fn();
	const json = vi.fn((body) => body);
	const get = vi.fn(() => "req-123");
	return { status, json, get };
}

describe("errorUtil", () => {
	test("formats expected HTTP errors", async () => {
		const c = context();
		await expect(
			errorUtil(
				new HTTPException(401, { message: "Unauthorized" }),
				c as never,
			),
		).resolves.toEqual({ status: 401, message: "Unauthorized", data: null });
		expect(c.status).toHaveBeenCalledWith(401);
	});

	test("formats Zod validation failures", async () => {
		const c = context();
		const error = z
			.object({ email: z.email() })
			.safeParse({ email: "bad" }).error;
		if (!error) {
			throw new Error("Expected a validation error");
		}

		await expect(errorUtil(error, c as never)).resolves.toMatchObject({
			status: 400,
			data: null,
		});
		expect(c.status).toHaveBeenCalledWith(400);
	});

	test("hides unexpected error details", async () => {
		const c = context();
		await expect(
			errorUtil(new Error("database password"), c as never),
		).resolves.toEqual({
			status: 500,
			message: "Internal server error",
			data: null,
		});
		expect(c.status).toHaveBeenCalledWith(500);
	});
});
