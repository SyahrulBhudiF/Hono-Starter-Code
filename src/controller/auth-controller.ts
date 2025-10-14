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
import type {
	LoginUserRequest,
	RegisterUserRequest,
	ResetPasswordRequest,
	SendOTPRequest,
	VerifyOTPRequest,
} from "../model/user-model";
import { AuthService } from "../service/auth-service";
import { ResponseUtil } from "../util/response-util";
import { EmailService } from "../service/email-service";
import { honoApp } from "../config/hono";
import { OtpService } from "../service/otp-service";
import { authMiddleware } from "../middleware/auth-middleware";
import { googleAuth } from "@hono/oauth-providers/google";
import { requireEnv } from "../util/util";

export const authController = honoApp();

authController.openapi(registerRoute, async (c) => {
	const request = (await c.req.json()) as RegisterUserRequest;

	const response = await AuthService.register(request);

	return c.json(ResponseUtil.success(response, "User registered successfully"));
});

authController.openapi(sendOTPRoute, async (c) => {
	const request = (await c.req.json()) as SendOTPRequest;

	await EmailService.sendOTP(request.email);

	return c.json(ResponseUtil.success(null, "OTP sent successfully"));
});

authController.openapi(verifyOTPRoute, async (c) => {
	const request = (await c.req.json()) as VerifyOTPRequest;

	await OtpService.verifyOTP(request, "register");

	return c.json(ResponseUtil.success(null, "OTP verified successfully"));
});

authController.openapi(loginRoute, async (c) => {
	const request = (await c.req.json()) as LoginUserRequest;

	const response = await AuthService.login(request);

	return c.json(ResponseUtil.success(response, "Login successfully"));
});

authController.use(
	"/logout",
	authMiddleware(requireEnv("JWT_ACCESS_SECRET") as string),
);

authController.openapi(logoutRoute, async (c) => {
	const token = c.get("token") as string;
	const userId = c.get("user")?.id as string;
	const refreshToken = await c.req.json();

	await AuthService.logout(token, refreshToken, userId);

	return c.json(ResponseUtil.success(null, "Logout successfully"));
});

authController.openapi(resetPasswordRoute, async (c) => {
	const request = (await c.req.json()) as ResetPasswordRequest;

	await AuthService.resetPassword(request);

	return c.json(ResponseUtil.success(null, "Reset password successfully"));
});

authController.use(
	"/google",
	googleAuth({
		client_id: requireEnv("GOOGLE_CLIENT_ID") as string,
		client_secret: requireEnv("GOOGLE_CLIENT_SECRET") as string,
		scope: ["openid", "email", "profile"],
	}),
);

authController.openapi(googleLoginRoute, async (c) => {
	const user = c.get("user-google");

	if (!user) {
		return c.json(
			ResponseUtil.error("Failed to fetch user from Google", 500),
			500,
		);
	}

	const response = await AuthService.googleLogin(user);

	return c.json(ResponseUtil.success(response, "Login successfully"));
});

authController.openapi(refreshTokenRoute, async (c) => {
	const request = (await c.req.json()) as { refreshToken: string };

	const response = await AuthService.refreshToken(request);

	return c.json(ResponseUtil.success(response, "Refresh token successfully"));
});
