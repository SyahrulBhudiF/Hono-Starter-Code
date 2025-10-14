import { type User, usersTable } from "../config/db/schema";
import { Repository } from "../types/repository";
import { db } from "../config/db";

export const UserRepository = new Repository<User>(db, usersTable);

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
	otp: number;
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
	otp: number;
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
