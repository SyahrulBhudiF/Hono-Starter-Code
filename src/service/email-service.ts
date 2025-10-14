import { OtpService } from "./otp-service";
import { logger } from "../config/logging";
import { emailQueue } from "../config/queue";
import { HTTPException } from "hono/http-exception";
import { UserRepository } from "../model/user-model";

export class EmailService {
	static async sendOTP(email: string): Promise<void> {
		const user = await UserRepository.findByColumn("email", email);

		if (!user)
			throw new HTTPException(404, {
				message: "User not found",
			});

		const otp = await OtpService.generateAndStoreOTP(email);

		await emailQueue.add({ email, otp });

		logger.info(`OTP job added to queue for ${email}`);
	}
}
