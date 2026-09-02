import { env } from "./config/env";
import { logger } from "./config/logging";
import { transporter } from "./config/mail";
import { emailQueue } from "./config/queue";
import { closeRedis } from "./config/redis";
import { otpEmail } from "./util/email-template";

const WORKER_CONCURRENCY = 5;

logger.info("Worker started");

emailQueue.process(WORKER_CONCURRENCY, async (job) => {
	const { email, otp } = job.data;
	const { subject, html } = otpEmail(otp);

	await transporter.sendMail({
		from: env.MAIL_FROM,
		to: email,
		subject,
		html,
	});

	logger.info(`OTP delivered for job ${job.id}`);
});

emailQueue.on("failed", (job, error) => {
	logger.error(
		`Email job ${job.id} failed on attempt ${job.attemptsMade}: ${error.message}`,
	);
});

emailQueue.on("error", (error) => {
	logger.error(`Email queue error: ${error.message}`);
});

let shuttingDown = false;

const shutdown = async (signal: string): Promise<void> => {
	if (shuttingDown) {
		return;
	}

	shuttingDown = true;
	logger.info(`Received ${signal}, shutting down worker`);

	await emailQueue.close();
	await closeRedis();

	process.exit(0);
};

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
