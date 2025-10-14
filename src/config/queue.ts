import Queue from "bull";
import { requireEnv } from "../util/util";

export const emailQueue = new Queue("emailQueue", {
	redis: {
		host: requireEnv("REDIS_HOST") as string,
		port: requireEnv("REDIS_PORT") as number,
		password: (requireEnv("REDIS_PASSWORD") as string) || undefined,
	},
});
