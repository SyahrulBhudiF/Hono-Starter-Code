import { sign } from "hono/jwt";
import type { User } from "../config/db/schema";
import { requireEnv } from "./util";

const ACCESS_TOKEN_EXPIRES_IN = parseInt(
	requireEnv("ACCESS_TOKEN_EXPIRES_IN"),
	10,
);
const REFRESH_TOKEN_EXPIRES_IN = parseInt(
	requireEnv("REFRESH_TOKEN_EXPIRES_IN"),
	10,
);
const JWT_ACCESS_SECRET = requireEnv("JWT_ACCESS_SECRET");
const JWT_REFRESH_SECRET = requireEnv("JWT_REFRESH_SECRET");

export async function generateAccessToken(user: User): Promise<string> {
	return await sign(
		{
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
			iat: Math.floor(Date.now() / 1000),
			exp: Math.floor(Date.now() / 1000) + 60 * 60 * ACCESS_TOKEN_EXPIRES_IN,
		},
		JWT_ACCESS_SECRET,
		"HS256",
	);
}

export async function generateRefreshToken(user: User): Promise<string> {
	return await sign(
		{
			id: user.id,
			iat: Math.floor(Date.now() / 1000),
			exp:
				Math.floor(Date.now() / 1000) + 60 * 60 * 24 * REFRESH_TOKEN_EXPIRES_IN,
		},
		JWT_REFRESH_SECRET,
		"HS256",
	);
}
