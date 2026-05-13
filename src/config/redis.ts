import Redis from "ioredis";
import { requireEnv } from "../util/util";

const redis = new Redis({
	host: requireEnv("REDIS_HOST"),
	port: requireEnv<number>("REDIS_PORT"),
	password: requireEnv("REDIS_PASSWORD", ["REDIS_PASSWORD"]) || undefined,
});

export default redis;
