export function otpEmail(otp: string): { subject: string; html: string } {
	return {
		subject: "Your OTP Code",
		html: [
			"<h2>Your Verification Code</h2>",
			`<p>Your OTP code is: <strong>${otp}</strong></p>`,
			"<p>This code will expire in 5 minutes.</p>",
		].join(""),
	};
}
