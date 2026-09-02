import { beforeAll, describe, expect, test, vi } from "vitest";
import { logger } from "../src/config/logging";

vi.mock("../src/config/redis", () => ({
	default: {
		expire: vi.fn(),
		incr: vi.fn().mockResolvedValue(1),
		ttl: vi.fn().mockResolvedValue(60),
	},
	pingRedis: vi.fn().mockResolvedValue(true),
	closeRedis: vi.fn(),
}));

vi.mock("../src/config/db", () => ({
	db: {},
	pingDatabase: vi.fn().mockResolvedValue(true),
	closeDatabase: vi.fn(),
}));

const loadApp = async () => {
	const { createApp } = await import("../src/app");
	return createApp();
};

describe("app", () => {
	let app: Awaited<ReturnType<typeof loadApp>>;

	beforeAll(async () => {
		app = await loadApp();
	});

	test("serves the application and API documentation", async () => {
		const [root, doc, scalar] = await Promise.all([
			app.request("/"),
			app.request("/doc"),
			app.request("/scalar"),
		]);
		const document = await doc.json();

		expect(root.status).toBe(200);
		expect(await root.text()).toBe("Hello Hono!");
		expect(doc.status).toBe(200);
		expect(document.openapi).toBe("3.1.0");
		expect(root.headers.get("x-request-id")).toBeTruthy();
		expect(document.paths["/api/v1/auth/login"]).toBeDefined();
		expect(await scalar.text()).toContain("Hono Starter API Reference");
	});

	test("no longer exposes the Swagger UI route", async () => {
		expect((await app.request("/ui")).status).toBe(404);
	});

	test("reports dependency health", async () => {
		const response = await app.request("/health");

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			status: "ok",
			checks: { database: true, redis: true },
		});
	});

	test("reports a degraded status when a dependency is down", async () => {
		const { pingRedis } = await import("../src/config/redis");
		vi.mocked(pingRedis).mockResolvedValueOnce(false);

		const response = await app.request("/health");

		expect(response.status).toBe(503);
		expect(await response.json()).toMatchObject({ status: "degraded" });
	});

	test("rejects invalid validated requests before the service runs", async () => {
		const response = await app.request("/api/v1/auth/login", {
			method: "POST",
			body: JSON.stringify({ email: "not-email", password: "x" }),
			headers: {
				"Content-Type": "application/json",
				Origin: "http://localhost:3000",
			},
		});
		const body = await response.json();

		expect(response.status).toBe(422);
		expect(body).toMatchObject({ status: 422 });
		expect(body.message).toContain("Invalid");
	});

	test("logs failed requests with their status", async () => {
		const infoSpy = vi.spyOn(logger, "info");

		const response = await app.request("/api/v1/auth/login", {
			method: "POST",
			body: JSON.stringify({ email: "not-email", password: "x" }),
			headers: {
				"Content-Type": "application/json",
				Origin: "http://localhost:3000",
			},
		});

		expect(response.status).toBe(422);
		expect(infoSpy).toHaveBeenCalledWith(
			expect.stringContaining(
				'"method":"POST",' + '"path":"/api/v1/auth/login",' + '"status":422',
			),
		);
		infoSpy.mockRestore();
	});
});
