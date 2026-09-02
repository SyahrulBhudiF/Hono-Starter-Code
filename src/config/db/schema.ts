import { sql } from "drizzle-orm";
import { pgEnum, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { Role } from "../../types/enum/role-enum";
import { enumToArray } from "../../util/enum-util";

export const roleEnum = pgEnum(
	"role",
	enumToArray(Role) as [string, ...string[]],
);

export const usersTable = pgTable("users", {
	id: uuid().primaryKey().default(sql`uuid_generate_v4()`),
	name: varchar({ length: 100 }).notNull(),
	email: varchar({ length: 100 }).notNull().unique(),
	password: varchar({ length: 255 }),
	role: roleEnum().default("USER").notNull(),
	emailVerified: timestamp({ withTimezone: true }),
	loginAt: timestamp({ withTimezone: true }),
	createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp({ withTimezone: true })
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
	deletedAt: timestamp({ withTimezone: true }),
});

export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
