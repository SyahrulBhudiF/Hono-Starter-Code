import Queue from "bull";
import { requireEnv } from "../util/util";

export const emailQueue = new Queue("emailQueue", {
	redis: {
		host: requireEnv("REDIS_HOST"),
		port: requireEnv<number>("REDIS_PORT"),
		password: requireEnv("REDIS_PASSWORD", ["REDIS_PASSWORD"]) || undefined,
	},
});
