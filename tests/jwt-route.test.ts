import { describe, expect, test } from "vitest";

process.env.ACCESS_TOKEN_EXPIRES_IN = "1";
process.env.REFRESH_TOKEN_EXPIRES_IN = "7";
process.env.JWT_ACCESS_SECRET = "test-access-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";

const { verify } = await import("hono/jwt");
const { generateAccessToken, generateRefreshToken } = await import(
	"../src/util/jwt-util"
);
const { createResponses, jsonBody } = await import("../src/util/route-util");
const { z } = await import("@hono/zod-openapi");

const user = {
	id: "f89d208b-77d4-4f64-9d2a-5e7dc044a150",
	name: "Jane Doe",
	email: "jane@example.com",
	password: null,
	role: "USER" as const,
	emailVerified: null,
	loginAt: null,
	createdAt: null,
	updatedAt: null,
	deletedAt: null,
};

describe("JWT and OpenAPI helpers", () => {
	test("generates verifiable access and unique refresh tokens", async () => {
		const access = await generateAccessToken(user);
		const [firstRefresh, secondRefresh] = await Promise.all([
			generateRefreshToken(user),
			generateRefreshToken(user),
		]);
		const [accessPayload, firstPayload, secondPayload] = await Promise.all([
			verify(access, process.env.JWT_ACCESS_SECRET, "HS256"),
			verify(firstRefresh, process.env.JWT_REFRESH_SECRET, "HS256"),
			verify(secondRefresh, process.env.JWT_REFRESH_SECRET, "HS256"),
		]);

		expect(accessPayload).toMatchObject({ id: user.id, email: user.email });
		expect(firstPayload.id).toBe(user.id);
		expect(firstPayload.jti).toBeTypeOf("string");
		expect(firstPayload.jti).not.toBe(secondPayload.jti);
	});

	test("creates JSON request and complete error response schemas", () => {
		const schema = z.object({ name: z.string() });
		const body = jsonBody(schema);
		const responses = createResponses(schema);

		expect(body.body.content["application/json"].schema).toBe(schema);
		expect(Object.keys(responses).map(Number)).toEqual([
			200, 400, 401, 403, 404, 500,
		]);
		expect(responses[404].content["application/json"].example).toEqual({
			status: 404,
			message: "Resource not found",
			data: null,
		});
	});
});
