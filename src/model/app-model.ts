import type { User } from "../config/db/schema";

export type ApplicationVariables = {
	user?: User | null;
	token?: string | null;
};
