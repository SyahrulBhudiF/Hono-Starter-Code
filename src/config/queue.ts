import Queue from "bull";
import { env } from "./env";

export type EmailJob = {
	email: string;
	otp: string;
};

export const emailQueue = new Queue<EmailJob>("emailQueue", {
	redis: {
		host: env.REDIS_HOST,
		port: env.REDIS_PORT,
		password: env.REDIS_PASSWORD,
	},
	defaultJobOptions: {
		attempts: 3,
		backoff: { type: "exponential", delay: 5000 },
		removeOnComplete: true,
		removeOnFail: 100,
	},
});
