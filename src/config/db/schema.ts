import {integer, pgEnum, pgTable, timestamp, varchar} from "drizzle-orm/pg-core";
import {uuid} from "drizzle-orm/pg-core/columns/uuid";
import {sql} from "drizzle-orm";
import {date} from "drizzle-orm/pg-core/columns/date";

enum Role {
    USER = "USER",
    ADMIN = "ADMIN"
}

function toArray(enumObj: any): string[] {
    return Object.values(enumObj).filter(value => typeof value === "string") as string[];
}

export const roleEnum = pgEnum("role", toArray(Role) as [string, ...string[]]);

export const usersTable = pgTable("users", {
    id: uuid().unique().primaryKey().default(sql`uuid_generate_v4
    ()`),
    name: varchar({length: 100}).notNull(),
    email: varchar({length: 100}).notNull().unique(),
    password: varchar({length: 255}).notNull(),
    role: roleEnum().default("USER").notNull(),
    emailVerified: timestamp().default(sql`NULL`),
    createdAt: date().default(sql`now
    ()`),
    updatedAt: date().default(sql`now
    ()`),
    deletedAt: date().default(sql`NULL`),
});

export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;