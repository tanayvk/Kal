import { Hono } from "hono";
import { cors } from "hono/cors";
import db from "./database";
import { desc, sql } from "drizzle-orm";
import {
  users,
  senders,
  smtpServers,
  subscribers,
  emails,
  config,
  subscriptions,
  lists as listsTable,
} from "./schema";
import { validateToken, comparePassword, generateToken } from "./auth";
import { pushEvent } from "./events";
import { getFilter } from "./filter";

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

app.get("/api/unsubscribe/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  await db
    .update(subscribers)
    .set({ status: "unsubscribed" })
    .where(sql`id = ${id}`);
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
  const {
    name,
    email,
    attributes = {},
    confirmed = false,
  } = await c.req.json();
  const existingSubscriber = (
    await db
      .select()
      .from(subscribers)
      .where(sql`email = ${email}`)
  )[0];
  // TODO: send confirmation again, if it's been a while??
  if (existingSubscriber) {
    return c.json({
      data: null,
      message: "Email already subscribed",
      success: false,
    });
  }
  // TODO: check opt-in from list settings
  const status = confirmed ? "subscribed" : "unconfirmed";
  const sub = (
    await db
      .insert(subscribers)
      .values({ name, email, attributes, status })
      .returning({ id: subscribers.id })
  )[0];
  if (!confirmed) {
    pushEvent({
      type: "ConfirmationEmail",
      sub: sub.id,
    });
  }
  return c.json({
    data: null,
    message: "Subscription successful",
    success: true,
  });
});

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
  const subs = await db
    .select({
      name: subscribers.name,
      email: subscribers.email,
      attributes: subscribers.attributes,
      id: subscribers.id,
    })
    .from(subscribers)
    .innerJoin(subscriptions, sql`subscribers.id = subscriptions.subscriber`)
    .where(
      sql`subscriptions.list IN (${lists.join(
        ", ",
      )}) AND subscribers.status = "subscribed"`,
    );
  let filterFn: any;
  try {
    filterFn = getFilter(filter);
  } catch {}
  const sendSubs = subs.filter((sub) =>
    filterFn({
      name: sub.name,
      email: sub.email,
      sub: sub.attributes,
    }),
  );
  return c.json({ data: sendSubs.length });
});

app.put("/api/config", validateToken, async (c) => {
  const { defaultSender, welcomeEmail, confirmationEmail, siteUrl } =
    await c.req.json();
  await db
    .update(config)
    .set({ defaultSender, welcomeEmail, confirmationEmail, siteUrl });
  return c.json({ data: null });
});

export default app;
