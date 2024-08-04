import * as nodemailer from "nodemailer";
import { sql } from "drizzle-orm";
import { marked } from "marked";
import { Liquid } from "liquidjs";
import * as jwt from "jsonwebtoken";
import { XMLBuilder, XMLParser } from "fast-xml-parser";

import { EmailMessagePayload } from "./types";
import { emails, senders, sendingQueue, subscribers, config } from "./schema";
import { getSecret } from "./config";
import db from "./database";

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

async function addOpenTracking({
  html,
  event,
  siteUrl,
  jwtSecret,
  subscriber,
}) {
  const openToken = jwt.sign({ e: event, s: subscriber }, jwtSecret);
  return (
    html +
    `<img src="${siteUrl}/api/open?p=${encodeURIComponent(openToken)}" />`
  );
}

const xmlOptions = {
  ignoreAttributes: false,
  preserveOrder: true,
  trimValues: false,
};
const xmlParser = new XMLParser(xmlOptions);
const xmlBuilder = new XMLBuilder(xmlOptions);

async function addLinkTracking({
  siteUrl,
  html,
  event,
  jwtSecret,
  subscriber,
}) {
  const obj = xmlParser.parse(html);
  updateLinks(obj);
  function updateLinks(obj: any) {
    if (Array.isArray(obj)) obj.forEach((o) => updateLinks(o));
    else if (typeof obj === "object") {
      if ({}.hasOwnProperty.call(obj, "@_href")) {
        // skip Kal links
        if (obj["@_href"].startsWith(siteUrl)) return;
        const linkToken = jwt.sign(
          { e: event, u: obj["@_href"], s: subscriber },
          jwtSecret,
        );
        obj["@_href"] = `${siteUrl}/api/track?p=${encodeURIComponent(
          linkToken,
        )}`;
      } else Object.values(obj).forEach((o) => updateLinks(o));
    }
  }
  return xmlBuilder.build(obj) + "";
}

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
  const jwtSecret = await getSecret();
  const { siteUrl, linkTracking, openTracking } = (
    await db
      .select({
        siteUrl: config.siteUrl,
        linkTracking: config.linkTracking,
        openTracking: config.openTracking,
      })
      .from(config)
  )[0];

  const context = {
    name: subObj.name,
    email: subObj.email,
    sub: subObj.attributes || {},
    unsubscribe_link: `${siteUrl}/api/unsubscribe/${subObj.id}/${subObj.uuid}`,
    confirm_link: `${siteUrl}/api/confirm/${subObj.id}/${subObj.uuid}`,
    update_prefs_link: `${siteUrl}/sub/${subObj.id}/${subObj.uuid}/update`,
  };
  const subject = await engine.render(
    engine.parse(emailObj.subject || ""),
    context,
  );
  const body = await engine.render(engine.parse(emailObj.body || ""), context);
  let html = emailObj.type === "plaintext" ? body : marked.parse(body);

  if (linkTracking) {
    html = await addLinkTracking({
      siteUrl,
      jwtSecret,
      html,
      event,
      subscriber: sub,
    });
  }
  if (openTracking) {
    html = await addOpenTracking({
      siteUrl,
      html,
      jwtSecret,
      event,
      subscriber: sub,
    });
  }

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
        html: html.toString(),
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
        console.log("sending", email.payload);
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
