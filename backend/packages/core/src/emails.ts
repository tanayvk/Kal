import * as nodemailer from "nodemailer";
import fm from "front-matter";
import { Liquid } from "liquidjs";
import { marked } from "marked";

import { getSMTPCredentials } from "./secrets";
import { EmailsService } from "./database";
import { getSubscribers } from "./utils";
import { Resource } from "sst";

const engine = new Liquid();

let transporter: any;
async function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport(await getSMTPCredentials());
  return transporter;
}

type Email = {
  to: string;
  subject: string;
  html: string;
};
export async function sendEmail(email: Email) {
  const creds = await getSMTPCredentials();
  const transporter = await getTransporter();
  return await transporter.sendMail({
    from: creds.from,
    to: email.to,
    subject: email.subject,
    html: email.html,
  });
}

// run this as a cron job + when sending a email right away
// TODO: try switching to using Event Scheduler for scheduling emails
// for Scheduler, we can just schedule this function
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

  const subs = await getSubscribers();
  const subsById: Record<string, any> = {};
  subs.forEach((sub) => (subsById[sub.subscriberId] = sub));

  await Promise.all(
    emails.data.map(async (email) => {
      try {
        const event = eventsById[email.eventId];
        const sub = subsById[email.subscriberId];
        const content = fm(
          await engine.render(event.template, {
            sub,
            unsubscribe_link: `${Resource.Api.url}/unsub?id=${sub.subscriberId}`,
          }),
        );
        // TODO: better settings for concurrency, email deliverability, and scheduling
        await sendEmail({
          to: sub.email,
          subject: (content.attributes as any).Subject,
          html: marked.parse(content.body) as string,
        });
        await EmailsService.entities.Email.update({ emailId: email.emailId })
          .set({ status: "sent" })
          .go();
      } catch (err) {
        console.log("err sending", email.emailId, err);
        await EmailsService.entities.Email.update({ emailId: email.emailId })
          .add({ retries: 1 })
          .go();
      }
    }),
  );
}

// const template = engine.parse(email);
// const subs = await getSubscribers();
// for (const sub of subs) {
// }
