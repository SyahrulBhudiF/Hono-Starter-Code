import { createRouteUtil } from "../util/route-util";
import { z } from "zod";
import { AuthValidation } from "../validation/auth-validation";

export const registerRoute = createRouteUtil({
	method: "post",
	path: "/register",
	tags: ["Auth"],
	responseSchema: z.object({
		status: z.string(),
		message: z.string(),
		data: z.object({
			email: z.string(),
			name: z.string(),
		}),
	}),
	requestSchema: AuthValidation.REGISTER,
	description: "Register a new user",
});

export const sendOTPRoute = createRouteUtil({
	method: "post",
	path: "/send-otp",
	tags: ["Auth"],
	responseSchema: z.object({
		status: z.string(),
		message: z.string(),
		data: z.null(),
	}),
	requestSchema: AuthValidation.SEND_OTP,
	description: "Send OTP to the user",
});

export const verifyOTPRoute = createRouteUtil({
	method: "post",
	path: "/verify-otp",
	tags: ["Auth"],
	responseSchema: z.object({
		status: z.string(),
		message: z.string(),
		data: z.null(),
	}),
	requestSchema: AuthValidation.VERIFY_OTP,
	description: "Verify OTP of the user",
});

export const loginRoute = createRouteUtil({
	method: "post",
	path: "/login",
	tags: ["Auth"],
	responseSchema: z.object({
		status: z.string(),
		message: z.string(),
		data: z.object({
			email: z.string().email(),
			name: z.string(),
			role: z.string(),
			accessToken: z.string(),
			refreshToken: z.string(),
		}),
	}),
	requestSchema: AuthValidation.LOGIN,
	description: "Login to the application",
});

export const logoutRoute = createRouteUtil({
	method: "post",
	path: "/logout",
	tags: ["Auth"],
	responseSchema: z.object({
		status: z.string(),
		message: z.string(),
		data: z.null(),
	}),
	requestSchema: z.object({
		refreshToken: z.string(),
	}),
	security: [{ BearerAuth: [] }],
	description: "Logout from the application",
});

export const resetPasswordRoute = createRouteUtil({
	method: "post",
	path: "/reset-password",
	tags: ["Auth"],
	responseSchema: z.object({
		status: z.string(),
		message: z.string(),
		data: z.null(),
	}),
	requestSchema: AuthValidation.RESET_PASSWORD,
	description: "Reset password of the user",
});

export const googleLoginRoute = createRouteUtil({
	method: "get",
	path: "/google",
	tags: ["Auth"],
	responseSchema: z.object({
		status: z.string(),
		message: z.string(),
		data: z.object({
			email: z.string().email(),
			name: z.string(),
			role: z.string(),
			accessToken: z.string(),
			refreshToken: z.string(),
		}),
	}),
	description: "Login with google",
});

export const refreshTokenRoute = createRouteUtil({
	method: "post",
	path: "/refresh-token",
	tags: ["Auth"],
	responseSchema: z.object({
		status: z.string(),
		message: z.string(),
		data: z.object({
			accessToken: z.string(),
			refreshToken: z.string(),
		}),
	}),
	requestSchema: z.object({
		refreshToken: z.string(),
	}),
	description: "Refresh token",
});
