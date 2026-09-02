import { sign } from "hono/jwt";
import type { User } from "../config/db/schema";
import { env } from "../config/env";

export async function generateAccessToken(user: User): Promise<string> {
	const issuedAt = Math.floor(Date.now() / 1000);

	return await sign(
		{
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
			jti: crypto.randomUUID(),
			iat: issuedAt,
			exp: issuedAt + 60 * 60 * env.ACCESS_TOKEN_EXPIRES_IN,
		},
		env.JWT_ACCESS_SECRET,
		"HS256",
	);
}

export async function generateRefreshToken(user: User): Promise<string> {
	const issuedAt = Math.floor(Date.now() / 1000);

	return await sign(
		{
			id: user.id,
			jti: crypto.randomUUID(),
			iat: issuedAt,
			exp: issuedAt + 60 * 60 * 24 * env.REFRESH_TOKEN_EXPIRES_IN,
		},
		env.JWT_REFRESH_SECRET,
		"HS256",
	);
}
