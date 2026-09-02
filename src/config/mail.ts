import nodemailer from "nodemailer";
import { env } from "./env";

export const transporter = nodemailer.createTransport({
	service: env.MAIL_SERVICE,
	host: env.MAIL_HOST,
	port: env.MAIL_PORT,
	secure: env.MAIL_PORT === 465,
	auth: {
		user: env.MAIL_USERNAME,
		pass: env.MAIL_PASSWORD,
	},
});
