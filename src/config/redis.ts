import Redis from "ioredis";
import { requireEnv } from "../util/util";

const redis = new Redis({
	host: requireEnv("REDIS_HOST") as string,
	port: requireEnv("REDIS_PORT") as number,
	password: (requireEnv("REDIS_PASSWORD") as string) || undefined,
});

export default redis;
