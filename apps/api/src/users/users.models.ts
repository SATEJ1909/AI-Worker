import { pgTable, serial, text, varchar } from "drizzle-orm/pg-core";

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name : varchar('name').notNull(),
  email: text('email').unique().notNull(),
  password: varchar('password').notNull(),
});