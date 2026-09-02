import { logger } from "../config/logging";
import { emailQueue } from "../config/queue";
import { userRepository } from "../repository/user-repository";
import { OtpService } from "./otp-service";

export const EmailService = {
	async sendOTP(email: string): Promise<void> {
		const user = await userRepository.findByEmail(email);

		if (!user) {
			logger.info("OTP request skipped for an unknown email");
			return;
		}

		const otp = await OtpService.generateAndStoreOTP(email);

		await emailQueue.add({ email, otp });

		logger.info("OTP job queued");
	},
};
