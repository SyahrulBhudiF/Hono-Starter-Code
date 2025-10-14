import { logger } from "./config/logging";
import { transporter } from "./config/mail";
import { emailQueue } from "./config/queue";

logger.info("Worker started");

emailQueue.process(async (job) => {
	const { email, otp } = job.data;

	const mailOptions = {
		from: process.env.EMAIL_USER,
		to: email,
		subject: "Your OTP Code",
		html: `
            <h2>Your Verification Code</h2>
            <p>Your OTP code is: <strong>${otp}</strong></p>
            <p>This code will expire in 5 minutes.</p>
        `,
	};

	try {
		logger.info(`Sending OTP to ${email}`);
		await transporter.sendMail(mailOptions);
		logger.info("OTP sent successfully");
	} catch (error) {
		logger.error(`Failed to send OTP ${error}`);
		throw new Error("Failed to send OTP");
	}
});
