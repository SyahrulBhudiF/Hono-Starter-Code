import type { User } from "../config/db/schema";

export type RegisterUserRequest = {
	name: string;
	email: string;
	password: string;
};

export type LoginUserRequest = {
	email: string;
	password: string;
};

export type ResetPasswordRequest = {
	email: string;
	password: string;
	otp: string;
};

export type UpdateUserRequest = {
	name?: string;
};

export type ChangePasswordRequest = {
	oldPassword?: string;
	newPassword: string;
};

export type SendOTPRequest = {
	email: string;
};

export type VerifyOTPRequest = {
	email: string;
	otp: string;
};

export type TokenResponse = {
	accessToken: string;
	refreshToken: string;
};

export type UserResponse = {
	email: string;
	name: string;
	role: string;
	accessToken?: string;
	refreshToken?: string;
};

export function toUserResponse(user: User): UserResponse {
	return {
		email: user.email,
		name: user.name,
		role: user.role,
	};
}
