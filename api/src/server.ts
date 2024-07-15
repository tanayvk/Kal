import { Hono } from "hono";
import db from "./database";
import { sql } from "drizzle-orm";
import { users, senders, smtpServers, config, subscribers } from "./schema";
import { validateToken, comparePassword, generateToken } from "./auth";

const app = new Hono();

app.post("/token", async (c) => {
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
  return c.json({ message: "Invalid credentials" }, 401);
});

app.get("/smtp", validateToken, async (c) => {
  const smtpList = await db.select().from(smtpServers);
  return c.json({ data: smtpList });
});

app.post("/smtp", validateToken, async (c) => {
  const { name, smtpConfig, setDefault } = await c.req.json();
  await db.transaction(async (t) => {
    const smtpServer = await t
      .insert(smtpServers)
      .values({ name, smtpConfig })
      .returning({ id: users.id });
    if (setDefault) {
      await t.update(config).set({ defaultSender: smtpServer[0]?.id });
    }
  });
  return c.json({ data: null });
});

app.put("/smtp/:id", validateToken, async (c) => {
  const id = parseInt(c.req.param("id"));
  const { name, smtpConfig, setDefault } = await c.req.json();
  await db.transaction(async (t) => {
    await t
      .update(smtpServers)
      .set({ name, smtpConfig })
      .where(sql`id = ${id}`);
    if (setDefault) {
      await t.update(config).set({ defaultSender: id });
    }
  });
  return c.json({ data: null });
});

app.get("/senders", validateToken, async (c) => {
  const senderList = await db.select().from(senders);
  return c.json({ data: senderList });
});

app.post("/senders", validateToken, async (c) => {
  const { from } = await c.req.json();
  await db.insert(senders).values({ from });
  return c.json({ data: null });
});

app.put("/senders/:id", validateToken, async (c) => {
  const id = c.req.param("id");
  const { from } = await c.req.json();
  await db
    .update(senders)
    .set({ from })
    .where(sql`id = ${id}`);
  return c.json({ data: null });
});

app.get("/unsubscribe/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  await db
    .update(subscribers)
    .set({ status: "unsubscribed" })
    .where(sql`id = ${id}`);
  return c.redirect("/unsubscribed");
});

app.get("/confirm/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  await db
    .update(subscribers)
    .set({ status: "subscribed" })
    .where(sql`id = ${id}`);
  return c.redirect("/confirmed");
});

app.post("/subscribe", async (c) => {
  const {
    name,
    email,
    attributes = {},
    confirmed = false,
  } = await c.req.json();
  const status = confirmed ? "subscribed" : "unconfirmed";
  await db.insert(subscribers).values({ name, email, attributes, status });
  return c.json({ data: null });
});

export default app;
