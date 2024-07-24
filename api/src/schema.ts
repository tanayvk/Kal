import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import * as uuid from "uuid";

import {
  EventPayload,
  EventType,
  SendingQueuePayload,
  SubscriberStatus,
} from "./types";

// TODO: add indexes

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
  smtpServer: integer("smtpServer", { mode: "number" }).references(
    () => smtpServers.id,
  ),
  ...timestamps(),
});

export const subscribers = sqliteTable("subscribers", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  name: text("name"),
  attributes: text("attributes", { mode: "json" }),
  status: text("status").$type<SubscriberStatus>(),
  uuid: text("uuid").$defaultFn(() => uuid.v4()),
  ...timestamps(),
});

export const events = sqliteTable("events", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  type: text("type").$type<EventType>(),
  payload: text("payload", { mode: "json" }).$type<EventPayload>(),
  time: text("time").default(sql`(CURRENT_TIMESTAMP)`),
  status: text("status").$type<"processed" | "pending">().default("pending"),
  ...timestamps(),
});

export const emails = sqliteTable("emails", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  type: text("type").$type<"plaintext" | "markdown">(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  createdBy: integer("created_by", { mode: "number" }).references(
    () => users.id,
  ),
  ...timestamps(),
});

export const sendingQueue = sqliteTable("sending_queue", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  sender: integer("sender", { mode: "number" }).references(() => senders.id),
  event: integer("event", { mode: "number" }).references(() => events.id),
  email: integer("email", { mode: "number" }).references(() => emails.id),
  status: text("status")
    .$type<"sent" | "pending" | "failed">()
    .default("pending")
    .notNull(),
  retries: integer("retries").default(0).notNull(),
  payload: text("payload", { mode: "json" }).$type<SendingQueuePayload>(),
  sentAt: text("sent_at"),
  ...timestamps(),
});

export const config = sqliteTable("config", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  jwtSecret: text("jwt_secret"),
  defaultSender: integer("default_sender", { mode: "number" }).references(
    () => senders.id,
  ),
  siteUrl: text("site_url"),
  welcomeEmail: integer("welcome_email", {
    mode: "number",
  }).references(() => emails.id),
  confirmationEmail: integer("confirmation_email", {
    mode: "number",
  }).references(() => emails.id),
  ...timestamps(),
});
