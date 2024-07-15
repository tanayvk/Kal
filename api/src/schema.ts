import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

const timestamps = () => ({
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
});

export const users = sqliteTable("users", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  ...timestamps(),
});

export const smtpServers = sqliteTable("smtp_servers", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text("name"),
  smtpConfig: text("smtp_config", { mode: "json" }),
  ...timestamps(),
});

export const senders = sqliteTable("senders", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  from: text("from").notNull(),
  ...timestamps(),
});

type SubscriberStatus = "subscribed" | "unsubscribed" | "unconfirmed";
export const subscribers = sqliteTable("subscribers", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  name: text("name"),
  attributes: text("attributes", { mode: "json" }),
  status: text("status").$type<SubscriberStatus>(),
  ...timestamps(),
});

type EventPayload = {
  filter: "string";
  type: "markdown" | "plaintext";
  time: "string";
  subject: "string";
  body: "string";
};
export const events = sqliteTable("events", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text("name"),
  sender: integer("sender")
    .notNull()
    .references(() => senders.id),
  payload: text("payload", { mode: "json" }).$type<EventPayload>(),
  ...timestamps(),
});

export const emails = sqliteTable("emails", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  type: text("type").$type<"plaintext" | "markdown">(),
  subject: text("subject"),
  body: text("body"),
  ...timestamps(),
});

export const config = sqliteTable("config", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  jwtSecret: text("secret"),
  defaultSender: integer("default_sender", { mode: "number" }).references(
    () => senders.id,
  ),
  ...timestamps(),
});
