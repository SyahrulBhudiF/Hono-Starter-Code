import { HTTPException } from "hono/http-exception";
import redis from "../config/redis";
import type { VerifyOTPRequest } from "../model/user-model";
import { userRepository } from "../repository/user-repository";
import { generateOTP } from "../util/otp-util";

export class OtpService {
	static async generateAndStoreOTP(email: string): Promise<string> {
		const otp = generateOTP();

		await redis.set(`otp:${email}`, otp, "EX", 300);
		return otp;
	}

	static async verifyOTP(
		request: VerifyOTPRequest,
		purpose?: string,
	): Promise<void> {
		const storedOTP = await redis.get(`otp:${request.email}`);
		if (storedOTP !== String(request.otp)) {
			throw new HTTPException(401, {
				message: "Invalid OTP",
			});
		}

		await redis.del(`otp:${request.email}`);

		if (purpose === "register") {
			const user = await userRepository.findByEmail(request.email);

			if (user?.emailVerified) {
				throw new HTTPException(400, {
					message: "Email already verified",
				});
			}

			await userRepository.updateByEmail(request.email, {
				emailVerified: new Date(),
			});
		}

		return;
	}
}
