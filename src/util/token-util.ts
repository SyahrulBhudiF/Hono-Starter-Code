import { HTTPException } from "hono/http-exception";
import type { JWTPayload } from "hono/utils/jwt/types";
import redis from "../config/redis";

export const blacklistKey = (tokenId: string): string => `blacklist:${tokenId}`;

export function getTokenId(payload: JWTPayload): string {
	if (typeof payload.jti !== "string" || payload.jti.length === 0) {
		throw new HTTPException(401, { message: "Unauthorized" });
	}

	return payload.jti;
}

export function getTokenSubject(payload: JWTPayload): string {
	if (typeof payload.id !== "string" || payload.id.length === 0) {
		throw new HTTPException(401, { message: "Unauthorized" });
	}

	return payload.id;
}

export function getTokenExpiresIn(payload: JWTPayload): number {
	if (typeof payload.exp !== "number") {
		throw new HTTPException(401, { message: "Unauthorized" });
	}

	return Math.max(1, payload.exp - Math.floor(Date.now() / 1000));
}

export async function isTokenBlacklisted(tokenId: string): Promise<boolean> {
	return (await redis.exists(blacklistKey(tokenId))) === 1;
}

export async function blacklistToken(
	tokenId: string,
	expiresIn: number,
	onlyIfAbsent = false,
): Promise<boolean> {
	const result = onlyIfAbsent
		? await redis.set(blacklistKey(tokenId), "1", "EX", expiresIn, "NX")
		: await redis.set(blacklistKey(tokenId), "1", "EX", expiresIn);

	return result === "OK";
}
