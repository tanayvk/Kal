import { Hono } from "hono";
import { cors } from "hono/cors";
import * as jwt from "jsonwebtoken";
import { desc, inArray, sql } from "drizzle-orm";

import db from "./database";
import {
  users,
  senders,
  smtpServers,
  subscribers,
  emails,
  config,
  subscriptions,
  lists as listsTable,
  tracking,
} from "./schema";
import { validateToken, comparePassword, generateToken } from "./auth";
import { pushEvent } from "./events";
import { getSubsByListsFilter } from "./utils/subs";
import { getSecret } from "./config";

const app = new Hono();

app.use("/api/*", cors());

app.post("/api/token", async (c) => {
  try {
    const { username, password } = await c.req.json();
    const user = await db
      .select()
      .from(users)
      .where(sql`username = ${username}`);
    if (user[0] && (await comparePassword(password, user[0].password))) {
      const token = await generateToken(user[0]);
      return c.json({ data: token });
    }
  } catch {}
  return c.json({ message: "Invalid credentials." }, 401);
});

app.get("/api/smtp", validateToken, async (c) => {
  const smtpList = await db.select().from(smtpServers);
  return c.json({ data: smtpList });
});

app.post("/api/smtp", validateToken, async (c) => {
  const { smtpConfig } = await c.req.json();
  await db.insert(smtpServers).values({ smtpConfig });
  return c.json({ data: null });
});

app.put("/api/smtp/:id", validateToken, async (c) => {
  const id = parseInt(c.req.param("id"));
  const { smtpConfig } = await c.req.json();
  await db
    .update(smtpServers)
    .set({ smtpConfig })
    .where(sql`id = ${id}`);
  return c.json({ data: null });
});

app.delete("/api/senders/:id", validateToken, async (c) => {
  const id = parseInt(c.req.param("id"));
  await db.delete(senders).where(sql`id = ${id}`);
  return c.json({ data: null });
});

app.delete("/api/smtp/:id", validateToken, async (c) => {
  const id = parseInt(c.req.param("id"));
  await db.delete(smtpServers).where(sql`id = ${id}`);
  return c.json({ data: null });
});

app.get("/api/smtp/:id", validateToken, async (c) => {
  const id = c.req.param("id");
  const smtp = (
    await db
      .select()
      .from(smtpServers)
      .where(sql`id = ${id}`)
  )[0];
  return c.json({ data: smtp });
});

app.get("/api/senders", validateToken, async (c) => {
  const senderList = await db.select().from(senders);
  return c.json({ data: senderList });
});

app.get("/api/senders/:id", validateToken, async (c) => {
  const id = c.req.param("id");
  const sender = (
    await db
      .select()
      .from(senders)
      .where(sql`id = ${id}`)
  )[0];
  return c.json({ data: sender });
});

app.post("/api/senders", validateToken, async (c) => {
  const { from, smtpServer, setDefault } = await c.req.json();
  const sender = await db
    .insert(senders)
    .values({ from, smtpServer })
    .returning({ id: senders.id });
  if (setDefault) {
    await db.update(config).set({ defaultSender: sender[0].id });
  }
  return c.json({ data: null });
});

app.put("/api/senders/:id", validateToken, async (c) => {
  const id = c.req.param("id");
  const { from, smtpServer } = await c.req.json();
  await db
    .update(senders)
    .set({ from, smtpServer })
    .where(sql`id = ${id}`);
  return c.json({ data: null });
});

app.get("/api/unsubscribe/:id/:uuid", async (c) => {
  const id = parseInt(c.req.param("id"));
  const uuid = c.req.param("uuid");
  await db
    .update(subscribers)
    .set({ status: "unsubscribed" })
    .where(sql`id = ${id} and uuid = ${uuid}`);
  return c.redirect("/unsubscribed");
});

app.get("/api/confirm/:id/:uuid", async (c) => {
  const id = parseInt(c.req.param("id"));
  const uuid = c.req.param("uuid");
  await db
    .update(subscribers)
    .set({ status: "subscribed" })
    .where(sql`id = ${id} and uuid = ${uuid}`);
  return c.redirect("/confirmed");
});

app.post("/api/subscribe", async (c) => {
  const { name, email, attributes = {}, lists = [] } = await c.req.json();
  // TODO: make double opt-in optional?
  const confirmed = false;
  const existingSubscriber = (
    await db
      .select()
      .from(subscribers)
      .where(sql`email = ${email}`)
  )[0];
  if (existingSubscriber) {
    if (existingSubscriber.status === "subscribed") {
      return c.json({
        data: null,
        message: "Email already subscribed",
        success: false,
      });
    } else {
      await db
        .update(subscribers)
        .set({
          name,
          attributes,
          status: confirmed ? "subscribed" : "unconfirmed",
        })
        .where(sql`email = ${email}`);

      if (!confirmed) {
        pushEvent({
          type: "ConfirmationEmail",
          sub: existingSubscriber.id,
        });
      }
      await manageSubscriptions(existingSubscriber.id, lists);
      return c.json({
        data: null,
        success: true,
      });
    }
  } else {
    const status = confirmed ? "subscribed" : "unconfirmed";
    const newSubscriber = (
      await db
        .insert(subscribers)
        .values({ name, email, attributes, status })
        .returning({ id: subscribers.id })
    )[0];
    if (!confirmed) {
      pushEvent({
        type: "ConfirmationEmail",
        sub: newSubscriber.id,
      });
    }
    await manageSubscriptions(newSubscriber.id, lists);
    return c.json({
      data: null,
      success: true,
    });
  }
});

app.put("/api/subscriber/:id/:uuid", async (c) => {
  const id = parseInt(c.req.param("id"));
  const uuid = c.req.param("uuid");
  const { name, attributes = {}, lists = [] } = await c.req.json();
  const existingSubscriber = (
    await db
      .select()
      .from(subscribers)
      .where(sql`id = ${id} AND uuid = ${uuid}`)
  )[0];
  if (!existingSubscriber) {
    c.status(404);
    return c.json({
      data: null,
      success: false,
    });
  }
  await db
    .update(subscribers)
    .set({
      name,
      attributes,
    })
    .where(sql`id = ${id}`);
  await manageSubscriptions(id, lists);
  return c.json({
    data: null,
    success: true,
  });
});

async function manageSubscriptions(subscriberId: number, listIds: number[]) {
  const filteredIds = listIds.filter((id) => typeof id === "number");
  const validLists =
    filteredIds.length > 0
      ? await db
          .select({ id: listsTable.id })
          .from(listsTable)
          .where(inArray(listsTable.id, filteredIds))
      : [];
  const validListIds = validLists.map((list) => list.id);
  const whereClause =
    validListIds.length > 0
      ? sql`subscriber = ${subscriberId} and list not in ${validListIds}`
      : sql`subscriber = ${subscriberId}`;
  await db.delete(subscriptions).where(whereClause);
  const newSubs = validListIds.map((listId) => ({
    subscriber: subscriberId,
    list: listId,
  }));
  if (newSubs.length > 0) {
    await db.insert(subscriptions).values(newSubs).onConflictDoNothing();
  }
}

app.post("/api/lists", validateToken, async (c) => {
  const { title, description } = await c.req.json();
  await db.insert(listsTable).values({ title, description });
  return c.json({ data: null });
});

app.post("/api/emails", validateToken, async (c) => {
  const json = await c.req.json();
  let { type = "markdown", subject = "", body = "" } = json;
  const { template, isTemplate } = json;
  // @ts-expect-error TODO wtf is this get overload error
  const user = c.get("user") as any;
  if (template) {
    const templateEmail = (
      await db
        .select()
        .from(emails)
        .where(sql`id = ${template}`)
    )[0];
    if (templateEmail) {
      type = templateEmail.type;
      subject = templateEmail.subject;
      body = templateEmail.body;
    }
  }
  const { id } = (
    await db
      .insert(emails)
      .values({
        type,
        subject,
        body,
        template: !!isTemplate,
        createdBy: user.id,
      })
      .returning({ id: emails.id })
  )[0];
  return c.json({ data: id });
});

app.get("/api/emails", validateToken, async (c) => {
  const templates = c.req.query("templates");
  const emailList = await db
    .select()
    .from(emails)
    .where(sql`template = ${templates ? true : false}`)
    .orderBy(desc(emails.createdAt));
  return c.json({ data: emailList });
});

app.get("/api/lists/:id", validateToken, async (c) => {
  const id = c.req.param("id");
  const list = (
    await db
      .select()
      .from(listsTable)
      .where(sql`id = ${id}`)
  )[0];
  return c.json({ data: list });
});

app.get("/api/emails/:id", validateToken, async (c) => {
  const id = c.req.param("id");
  const email = (
    await db
      .select()
      .from(emails)
      .where(sql`id = ${id}`)
  )[0];
  return c.json({ data: email });
});

app.delete("/api/lists/:id", validateToken, async (c) => {
  const id = c.req.param("id");
  await db.delete(listsTable).where(sql`id = ${id}`);
  return c.json({ data: null });
});

app.delete("/api/emails/:id", validateToken, async (c) => {
  const id = c.req.param("id");
  await db.delete(emails).where(sql`id = ${id}`);
  return c.json({ data: null });
});

app.put("/api/lists/:id", validateToken, async (c) => {
  const id = parseInt(c.req.param("id"));
  const { title, description } = await c.req.json();
  await db
    .update(listsTable)
    .set({ title, description })
    .where(sql`id = ${id}`);
  return c.json({ data: null });
});

app.put("/api/emails/:id", validateToken, async (c) => {
  const id = parseInt(c.req.param("id"));
  const { type, subject, body } = await c.req.json();
  await db
    .update(emails)
    .set({ type, subject, body })
    .where(sql`id = ${id}`);
  return c.json({ data: null });
});

app.post("/api/emails/:id/send", validateToken, async (c) => {
  const id = parseInt(c.req.param("id"));
  const { senderId, filter, time, lists = [] } = await c.req.json();
  // TODO: verify filter
  await pushEvent(
    {
      type: "SendEmail",
      sender: senderId,
      email: id,
      filter,
      lists,
    },
    time,
  );
  return c.json({ data: null });
});

app.get("/api/lists", validateToken, async (c) => {
  const data = await db.select().from(listsTable);
  return c.json({ data });
});

app.get("/api/subscribers", validateToken, async (c) => {
  const subs = await db.select().from(subscribers);
  return c.json({ data: subs });
});

app.get("/api/config", validateToken, async (c) => {
  const configObject = await db
    .select({
      defaultSender: config.defaultSender,
      welcomeEmail: config.welcomeEmail,
      confirmationEmail: config.confirmationEmail,
      siteUrl: config.siteUrl,
    })
    .from(config);
  return c.json({ data: configObject[0] });
});

app.post("/api/subs/check", validateToken, async (c) => {
  const { lists, filter } = await c.req.json();
  const subs = await getSubsByListsFilter(lists, filter);
  return c.json({ data: subs.length });
});

app.put("/api/config", validateToken, async (c) => {
  const { defaultSender, welcomeEmail, confirmationEmail, siteUrl } =
    await c.req.json();
  await db
    .update(config)
    .set({ defaultSender, welcomeEmail, confirmationEmail, siteUrl });
  return c.json({ data: null });
});

app.get("/api/sub-info", async (c) => {
  const lists = await db.select().from(listsTable);
  return c.json({ data: { lists } });
});

app.get("/api/sub/:id/:uuid", async (c) => {
  const id = parseInt(c.req.param("id"));
  const uuid = c.req.param("uuid");
  const subscriber = (
    await db
      .select({
        id: subscribers.id,
        name: subscribers.name,
        email: subscribers.email,
        uuid: subscribers.uuid,
      })
      .from(subscribers)
      .where(sql`id = ${id} AND uuid = ${uuid}`)
  )[0];
  if (!subscriber) {
    c.status(404);
    return c.json({
      data: null,
      message: "Subscriber not found",
      success: false,
    });
  }
  const lists = await db.select().from(listsTable);
  const subscribedLists = (
    await db
      .select({
        listId: subscriptions.list,
      })
      .from(subscriptions)
      .where(sql`subscriber = ${id}`)
  ).map((sub) => sub.listId);

  return c.json({
    data: {
      name: subscriber.name,
      email: subscriber.email,
      selectedLists: subscribedLists,
      lists,
    },
    success: true,
  });
});

async function trackLink(token: string) {
  try {
    const secret = await getSecret();
    const { s, e, u } = jwt.verify(token, secret) as any;
    await db.insert(tracking).values({
      type: "link",
      sub: s,
      event: e,
      url: u,
    });
  } catch (err) {
    console.log("err tracking link", err);
  }
}

async function trackOpen(token: string) {
  try {
    const secret = await getSecret();
    const { s, e } = jwt.verify(token, secret) as any;
    await db.insert(tracking).values({
      type: "open",
      sub: s,
      event: e,
    });
  } catch (err) {
    console.log("err tracking open", err);
  }
}

app.get("/api/track", async (c) => {
  const token = c.req.query("p") || "";
  const { u } = jwt.decode(token) as any;
  setTimeout(() => trackLink(token), 0);
  return c.redirect(u);
});

app.get("/api/open", async (c) => {
  console.log("sending image");
  const token = c.req.query("p") || "";
  setTimeout(() => trackOpen(token), 0);
  c.header("Content-Type", "image/png");
  const base64 =
    "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAHklEQVQ4T2NkoBAwUqifYdQAhtEwACai0XQwGMIAACaYABGnE9aRAAAAAElFTkSuQmCC";
  return c.body(base64);
});

export default app;
