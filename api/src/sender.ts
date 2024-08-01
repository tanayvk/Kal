import * as nodemailer from "nodemailer";
import { sql } from "drizzle-orm";
import db from "./database";

import { EmailMessagePayload } from "./types";
import { emails, senders, sendingQueue, subscribers } from "./schema";
import { marked } from "marked";
import { Liquid } from "liquidjs";

const transporters: Record<number, any> = {};
async function getTransporter(smtpServerId: number) {
  if (transporters[smtpServerId]) return transporters[smtpServerId];
  const smtpServer = await db.query.smtpServers.findFirst({
    where: sql`id = ${smtpServerId}`,
  });
  if (!smtpServer) {
    // TODO: handle error
  }
  const smtpConfig: any = smtpServer?.smtpConfig || {};
  return (transporters[smtpServerId] = nodemailer.createTransport({
    host: smtpConfig.host,
    port: parseInt(smtpConfig.port),
    secure: parseInt(smtpConfig.port) === 465, // TODO: does this work?
    auth: {
      user: smtpConfig.username,
      pass: smtpConfig.password,
    },
  }));
}

const engine = new Liquid();

// TODO: cache template
export const queueEmail = async (
  event: number,
  sender: number,
  email: number,
  sub: number,
) => {
  const { smtpServer, from } = (
    await db
      .select({ smtpServer: senders.smtpServer, from: senders.from })
      .from(senders)
      .where(sql`id = ${sender}`)
  )[0];
  const emailObj = (
    await db
      .select()
      .from(emails)
      .where(sql`id = ${email}`)
  )[0];
  const subObj = (
    await db
      .select()
      .from(subscribers)
      .where(sql`id = ${sub}`)
  )[0];

  const context = {
    name: subObj.name,
    email: subObj.email,
    sub: subObj.attributes || {},
    // TODO: unsubscribe link, confirm link
  };
  const subject = await engine.render(
    engine.parse(emailObj.subject || ""),
    context,
  );
  const body = await engine.render(engine.parse(emailObj.body || ""), context);
  const html = emailObj.type === "plaintext" ? body : marked.parse(body);

  await db.insert(sendingQueue).values({
    event,
    sender,
    email,
    payload: {
      smtpServer: smtpServer as number,
      from,
      to: subObj.email,
      email: {
        subject,
        html,
        text: "", // TODO: text version
      },
    },
  });
};

export const sendEmail = async (
  smtpServer: number,
  from: string,
  to: string,
  email: EmailMessagePayload,
) => {
  const transporter = await getTransporter(smtpServer);
  return await transporter.sendMail({
    from,
    to,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
};

const sendPendingEmails = async () => {
  const pendingEmails = await db
    .select({
      id: sendingQueue.id,
      payload: sendingQueue.payload,
      retries: sendingQueue.retries,
    })
    .from(sendingQueue)
    .where(sql`status = "pending"`);
  // TODO: concurrency and rate limitting
  for (const email of pendingEmails) {
    if (email?.payload) {
      try {
        await sendEmail(
          email.payload.smtpServer,
          email.payload.from,
          email.payload.to,
          email.payload.email,
        );
        await db
          .update(sendingQueue)
          .set({ status: "sent", sentAt: sql`(CURRENT_TIMESTAMP)` })
          .where(sql`id = ${email.id}`);
      } catch (error) {
        console.log("sendPendingEmails err", error);
        await db
          .update(sendingQueue)
          .set({
            ...(email.retries > 3 ? { status: "failed" } : {}),
            retries: email.retries + 1,
          })
          .where(sql`id = ${email.id}`);
      }
    }
  }
};

const SENDER_INTERVAL = 5 * 1000;
let sending = false,
  senderTimeout: Timer | null = null;
export const startSender = async () => {
  if (sending) return;
  sending = true;
  await sendPendingEmails();
  sending = false;
  if (senderTimeout) clearTimeout(senderTimeout);
  senderTimeout = setTimeout(startSender, SENDER_INTERVAL);
};
