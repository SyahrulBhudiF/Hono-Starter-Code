import { beforeAll, describe, expect, test, vi } from "vitest";

vi.mock("../src/config/redis", () => ({
	default: {
		expire: vi.fn(),
		incr: vi.fn().mockResolvedValue(1),
		ttl: vi.fn().mockResolvedValue(60),
	},
}));

const loadApp = async () => {
	process.env.DATABASE_URL ??=
		"postgres://postgres:postgres@localhost:5432/test";
	process.env.REDIS_HOST ??= "localhost";
	process.env.REDIS_PORT ??= "6379";
	process.env.JWT_ACCESS_SECRET ??= "test-access-secret";
	process.env.JWT_REFRESH_SECRET ??= "test-refresh-secret";
	process.env.ACCESS_TOKEN_EXPIRES_IN ??= "1";
	process.env.REFRESH_TOKEN_EXPIRES_IN ??= "7";
	process.env.GOOGLE_CLIENT_ID ??= "test-google-client";
	process.env.GOOGLE_CLIENT_SECRET ??= "test-google-secret";

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
});
