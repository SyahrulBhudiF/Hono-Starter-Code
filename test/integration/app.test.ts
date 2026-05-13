import { beforeAll, describe, expect, test } from "bun:test";

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

	const { createApp } = await import("../../src/app");
	return createApp();
};

describe("app", () => {
	let app: Awaited<ReturnType<typeof loadApp>>;

	beforeAll(async () => {
		app = await loadApp();
	});

	test("GET / returns hello", async () => {
		const res = await app.request("/");

		expect(res.status).toBe(200);
		expect(await res.text()).toBe("Hello Hono!");
	});

	test("GET /doc returns OpenAPI 3.1 document", async () => {
		const res = await app.request("/doc");
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.openapi).toBe("3.1.0");
		expect(body.info.title).toBe("Hono Starter API");
		expect(body.paths["/api/v1/auth/login"]).toBeDefined();
	});

	test("GET /scalar returns Scalar API reference", async () => {
		const res = await app.request("/scalar");
		const body = await res.text();

		expect(res.status).toBe(200);
		expect(body).toContain("Hono Starter API Reference");
	});

	test("invalid OpenAPI request returns validation error before service runs", async () => {
		const res = await app.request("/api/v1/auth/login", {
			method: "POST",
			body: JSON.stringify({ email: "not-email", password: "x" }),
			headers: { "Content-Type": "application/json" },
		});
		const body = await res.json();

		expect(res.status).toBe(422);
		expect(body.status).toBe(422);
		expect(body.message).toContain("Invalid");
	});
});
