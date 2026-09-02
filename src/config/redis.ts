import Redis from "ioredis";
import { env } from "./env";

const redis = new Redis({
	host: env.REDIS_HOST,
	port: env.REDIS_PORT,
	password: env.REDIS_PASSWORD,
});

export async function pingRedis(): Promise<boolean> {
	try {
		return (await redis.ping()) === "PONG";
	} catch {
		return false;
	}
}

export async function closeRedis(): Promise<void> {
	await redis.quit();
}

export default redis;
