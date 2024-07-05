import * as nodemailer from "nodemailer";
import fm from "front-matter";
import { Liquid } from "liquidjs";
import { marked } from "marked";
import { Resource } from "sst";
import { PromisePool } from "@supercharge/promise-pool";

import { EmailEntity, EmailsService, SenderItem } from "./database";
import { getSubscribers } from "./utils";
import { X2jOptions, XMLBuilder, XMLParser } from "fast-xml-parser";

const engine = new Liquid();

let transporters: Record<string, any> = {};
async function getTransporter(sender: SenderItem) {
  if (transporters[sender.senderId]) return transporters[sender.senderId];
  return (transporters[sender.senderId] = nodemailer.createTransport({
    host: sender.creds.host,
    port: sender.creds.port,
    secure: !!sender.creds.secure,
    auth: {
      user: sender.creds.user,
      pass: sender.creds.pass,
    },
  }));
}

type Email = {
  to: string;
  subject: string;
  html: string;
};
export async function sendEmail(email: Email, sender: SenderItem) {
  const transporter = await getTransporter(sender);
  return await transporter.sendMail({
    from: `"${sender.creds.name}" <${sender.creds.email}>`,
    to: email.to,
    subject: email.subject,
    html: email.html,
  });
}

const xmlOptions: X2jOptions = {
  ignoreAttributes: false,
  preserveOrder: true,
  trimValues: false,
};
const xmlParser = new XMLParser(xmlOptions);
const xmlBuilder = new XMLBuilder(xmlOptions);

// TODO: make analytics optional
async function addAnalytics(html: string, email: any) {
  let numLinks = 0;
  const links = {};
  const obj = xmlParser.parse(html);
  updateLinks(obj);

  function updateLinks(obj: any) {
    if (Array.isArray(obj)) obj.forEach((o) => updateLinks(o));
    else if (typeof obj === "object") {
      if ({}.hasOwnProperty.call(obj, "@_href")) {
        // skip Kal links
        if (obj["@_href"].startsWith(Resource.Api.url)) return;

        const linkKey = Buffer.from((++numLinks).toString()).toString("base64");
        links[linkKey] = obj["@_href"];
        obj[
          "@_href"
        ] = `${Resource.Api.url}/track/${email.emailId}?link=${linkKey}`;
      } else Object.values(obj).forEach((o) => updateLinks(o));
    }
  }
  const htmlWithLinks = xmlBuilder.build(obj);
  return [
    htmlWithLinks +
      `<img src="${Resource.Api.url}/image/${email.emailId}.png" />`,
    links,
  ];
}

// run this as a cron job + when sending a email right away
// TODO: try switching to using Event Scheduler for scheduling emails
// for Scheduler, we can just schedule this function
// TODO: email deliverability, concurrency
export async function sender() {
  const buffer = 2 * 60 * 1000; // 2 minutes
  const emails = await EmailsService.entities.Email.query
    .bySent({ status: "pending" })
    .lte({ time: new Date().getTime() + buffer })
    .go();
  console.log("sending", emails.data.length);

  const eventsById: Record<string, any> = {};
  const eventIds = new Set(emails.data.map((email) => email.eventId));
  const events = await Promise.all(
    [...eventIds].map((eventId) =>
      EmailsService.entities.Event.get({ eventId })
        .go()
        .then(({ data }) => data),
    ),
  );
  events.filter(Boolean).forEach((event: any) => {
    eventsById[event?.eventId as string] = event;
    event.template = engine.parse(event?.payload.fileData);
  });

  const sendersById: Record<string, any> = {};
  const senderIds = new Set(emails.data.map((email) => email.senderId));
  const senders = await Promise.all(
    [...senderIds].map((senderId) =>
      EmailsService.entities.Sender.get({ senderId })
        .go()
        .then(({ data }) => data),
    ),
  );
  senders.filter(Boolean).forEach((sender: any) => {
    sendersById[sender?.senderId as string] = sender;
  });

  const subs = await getSubscribers();
  const subsById: Record<string, any> = {};
  subs.forEach((sub) => (subsById[sub.subscriberId] = sub));

  await PromisePool.withConcurrency(1) // TODO: set concurrency from config
    .for(emails.data)
    .process(handleEmail);

  async function handleEmail(email: EmailEntity) {
    try {
      try {
        await EmailsService.entities.Email.update({ emailId: email.emailId })
          .set({ status: "sending" })
          .where(({ status }, { eq }) => eq(status, "pending"))
          .go();
      } catch {
        // email got picked up other sender, skip
        console.log("skipping email", email.emailId);
        return;
      }
      const sender = sendersById[email.senderId];
      const event = eventsById[email.eventId];
      const sub = subsById[email.subscriberId];
      const content = fm(
        await engine.render(event.template, {
          sub,
          unsubscribe_link: `${Resource.Api.url}/unsub?id=${sub.subscriberId}`,
        }),
      );
      const [htmlWithAnalytics, links] = await addAnalytics(
        marked.parse(content.body) as string,
        email,
      );
      await sendEmail(
        {
          to: sub.email,
          subject: (content.attributes as any).Subject,
          html: htmlWithAnalytics as string,
        },
        sender,
      );
      await EmailsService.entities.Email.update({ emailId: email.emailId })
        .set({ status: "sent", links })
        .go();
    } catch (err) {
      console.log("err sending", email.emailId, err);
      await EmailsService.entities.Email.update({ emailId: email.emailId })
        .add({ retries: 1 }) // TODO: wtf is this TS error
        .set({ status: (email.retries || 0) > 3 ? "failed" : "pending" })
        .go();
    }
  }
}
