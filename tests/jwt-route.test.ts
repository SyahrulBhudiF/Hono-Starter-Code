import { describe, expect, test } from "vitest";

const { verify } = await import("hono/jwt");
const { generateAccessToken, generateRefreshToken } = await import(
	"../src/util/jwt-util"
);
const { createResponses, jsonBody } = await import("../src/util/route-util");
const { z } = await import("@hono/zod-openapi");
const { env } = await import("../src/config/env");
const { userFixture } = await import("./fixtures");

const user = userFixture({ password: null });

describe("JWT and OpenAPI helpers", () => {
	test("generates verifiable access and unique refresh tokens", async () => {
		const access = await generateAccessToken(user);
		const [firstRefresh, secondRefresh] = await Promise.all([
			generateRefreshToken(user),
			generateRefreshToken(user),
		]);
		const [accessPayload, firstPayload, secondPayload] = await Promise.all([
			verify(access, env.JWT_ACCESS_SECRET, "HS256"),
			verify(firstRefresh, env.JWT_REFRESH_SECRET, "HS256"),
			verify(secondRefresh, env.JWT_REFRESH_SECRET, "HS256"),
		]);

		expect(accessPayload).toMatchObject({ id: user.id, email: user.email });
		expect(accessPayload.jti).toBeTypeOf("string");
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
			200, 400, 401, 403, 404, 429, 500,
		]);
		expect(responses[404].content["application/json"].example).toEqual({
			status: 404,
			message: "Resource not found",
			data: null,
		});
	});
});
