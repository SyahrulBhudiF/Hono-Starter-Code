import { pgEnum, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { uuid } from "drizzle-orm/pg-core/columns/uuid";
import { sql } from "drizzle-orm";
import { date } from "drizzle-orm/pg-core/columns/date";
import { Role } from "../../types/enum/role-enum";
import { enumToArray } from "../../util/enum-util";

export const roleEnum = pgEnum(
	"role",
	enumToArray(Role) as [string, ...string[]],
);

export const usersTable = pgTable("users", {
	id: uuid()
		.unique()
		.primaryKey()
		.default(sql`uuid_generate_v4
    ()`),
	name: varchar({ length: 100 }).notNull(),
	email: varchar({ length: 100 }).notNull().unique(),
	password: varchar({ length: 255 }).default(sql`NULL`),
	role: roleEnum().default("USER").notNull(),
	emailVerified: timestamp().default(sql`NULL`),
	loginAt: timestamp().default(sql`NULL`),
	createdAt: date().default(sql`now
    ()`),
	updatedAt: date().default(sql`now
    ()`),
	deletedAt: date().default(sql`NULL`),
});

export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
