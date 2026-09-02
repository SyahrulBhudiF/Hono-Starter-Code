import { googleAuth } from "@hono/oauth-providers/google";
import { HTTPException } from "hono/http-exception";
import { env } from "../config/env";
import { honoApp } from "../config/hono";
import { authMiddleware } from "../middleware/auth-middleware";
import {
	googleLoginRoute,
	loginRoute,
	logoutRoute,
	refreshTokenRoute,
	registerRoute,
	resetPasswordRoute,
	sendOTPRoute,
	verifyOTPRoute,
} from "../route/auth-route";
import { AuthService } from "../service/auth-service";
import { EmailService } from "../service/email-service";
import { OtpService } from "../service/otp-service";
import { ResponseUtil } from "../util/response-util";

export const authController = honoApp();

authController.openapi(registerRoute, async (c) => {
	const request = c.req.valid("json");

	const response = await AuthService.register(request);

	return c.json(
		ResponseUtil.success(response, "User registered successfully"),
		200,
	);
});

authController.openapi(sendOTPRoute, async (c) => {
	const request = c.req.valid("json");

	await EmailService.sendOTP(request.email);

	return c.json(ResponseUtil.success(null, "OTP sent successfully"), 200);
});

authController.openapi(verifyOTPRoute, async (c) => {
	const request = c.req.valid("json");

	await OtpService.verifyOTP(request, "register");

	return c.json(ResponseUtil.success(null, "OTP verified successfully"), 200);
});

authController.openapi(loginRoute, async (c) => {
	const request = c.req.valid("json");

	const response = await AuthService.login(request);

	return c.json(ResponseUtil.success(response, "Login successfully"), 200);
});

authController.use("/logout", authMiddleware(env.JWT_ACCESS_SECRET));

authController.openapi(logoutRoute, async (c) => {
	const token = c.get("token");
	const userId = c.get("user").id;
	const { refreshToken } = c.req.valid("json");

	await AuthService.logout(token, refreshToken, userId);

	return c.json(ResponseUtil.success(null, "Logout successfully"), 200);
});

authController.openapi(resetPasswordRoute, async (c) => {
	const request = c.req.valid("json");

	await AuthService.resetPassword(request);

	return c.json(ResponseUtil.success(null, "Reset password successfully"), 200);
});

authController.use(
	"/google",
	googleAuth({
		client_id: env.GOOGLE_CLIENT_ID,
		client_secret: env.GOOGLE_CLIENT_SECRET,
		scope: ["openid", "email", "profile"],
	}),
);

authController.openapi(googleLoginRoute, async (c) => {
	const user = c.get("user-google");

	if (!user) {
		throw new HTTPException(502, {
			message: "Failed to fetch user from Google",
		});
	}

	const response = await AuthService.googleLogin(user);

	return c.json(ResponseUtil.success(response, "Login successfully"), 200);
});

authController.openapi(refreshTokenRoute, async (c) => {
	const request = c.req.valid("json");

	const response = await AuthService.refreshToken(request);

	return c.json(
		ResponseUtil.success(response, "Refresh token successfully"),
		200,
	);
});
