import { createRoute, z } from "@hono/zod-openapi";
import { createResponses, jsonBody } from "../util/route-util";
import { AuthValidation } from "../validation/auth-validation";

const authResponse = z.object({
	status: z.string(),
	message: z.string(),
	data: z.object({
		email: z.email(),
		name: z.string(),
		role: z.string(),
		accessToken: z.string().optional(),
		refreshToken: z.string().optional(),
	}),
});

export const registerRoute = createRoute({
	method: "post",
	path: "/register",
	tags: ["Auth"],
	request: jsonBody(AuthValidation.REGISTER),
	responses: createResponses(authResponse),
	description: "Register a new user",
});

export const sendOTPRoute = createRoute({
	method: "post",
	path: "/send-otp",
	tags: ["Auth"],
	request: jsonBody(AuthValidation.SEND_OTP),
	responses: createResponses(
		z.object({
			status: z.string(),
			message: z.string(),
			data: z.null(),
		}),
	),
	description: "Send OTP to the user",
});

export const verifyOTPRoute = createRoute({
	method: "post",
	path: "/verify-otp",
	tags: ["Auth"],
	request: jsonBody(AuthValidation.VERIFY_OTP),
	responses: createResponses(
		z.object({
			status: z.string(),
			message: z.string(),
			data: z.null(),
		}),
	),
	description: "Verify OTP of the user",
});

export const loginRoute = createRoute({
	method: "post",
	path: "/login",
	tags: ["Auth"],
	request: jsonBody(AuthValidation.LOGIN),
	responses: createResponses(authResponse.required()),
	description: "Login to the application",
});

export const logoutRoute = createRoute({
	method: "post",
	path: "/logout",
	tags: ["Auth"],
	request: jsonBody(
		z.object({
			refreshToken: z.string(),
		}),
	),
	responses: createResponses(
		z.object({
			status: z.string(),
			message: z.string(),
			data: z.null(),
		}),
	),
	security: [{ BearerAuth: [] }],
	description: "Logout from the application",
});

export const resetPasswordRoute = createRoute({
	method: "post",
	path: "/reset-password",
	tags: ["Auth"],
	request: jsonBody(AuthValidation.RESET_PASSWORD),
	responses: createResponses(
		z.object({
			status: z.string(),
			message: z.string(),
			data: z.null(),
		}),
	),
	description: "Reset password of the user",
});

export const googleLoginRoute = createRoute({
	method: "get",
	path: "/google",
	tags: ["Auth"],
	responses: createResponses(authResponse.required()),
	description: "Login with google",
});

export const refreshTokenRoute = createRoute({
	method: "post",
	path: "/refresh-token",
	tags: ["Auth"],
	request: jsonBody(
		z.object({
			refreshToken: z.string(),
		}),
	),
	responses: createResponses(
		z.object({
			status: z.string(),
			message: z.string(),
			data: z.object({
				accessToken: z.string(),
				refreshToken: z.string(),
			}),
		}),
	),
	description: "Refresh token",
});
