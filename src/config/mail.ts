import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
	service: process.env.MAIL_SERVICE,
	host: process.env.MAIL_HOST,
	port: Number(process.env.MAIL_PORT),
	secure: false,
	auth: {
		user: process.env.MAIL_USERNAME,
		pass: process.env.MAIL_PASSWORD,
	},
});
