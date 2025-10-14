import crypto from "node:crypto";

export function generateOTP(length: number = 6): string {
	const randomBytes = crypto.randomBytes(length);
	let otp = "";

	for (let i = 0; i < length; i++) {
		const digit = randomBytes[i] % 10;
		otp += digit.toString();
	}

	return otp;
}
