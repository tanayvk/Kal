import fm from "front-matter";
import * as marked from "marked";
import { ApiHandler, useJsonBody } from "sst/node/api";

import { EmailsService } from "@email-marketing/core/src/database";
import {
  addSubscriber,
  confirmSubscriber,
  removeSubscriber,
} from "@email-marketing/core/src/subscribers";
import { sendEmail } from "@email-marketing/core/src/emails";

export const sub = ApiHandler(async function (event) {
  // TODO: get the endpoint in a better way?
  const endpoint = event.headers.Host as string;
  const body = useJsonBody();
  // TODO: add error handling
  await addSubscriber(body.name, body.email, endpoint);
});

export async function unsub(event: any) {
  const { id } = event.queryStringParameters;
  await removeSubscriber(id);
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/plain",
    },
    body: "You've been unsubscribed.",
  };
}

export async function confirmSub(event: any) {
  const { id } = event.queryStringParameters;
  await confirmSubscriber(id);
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/plain",
    },
    body: "Thanks for confirming your subscription.",
  };
}

export async function checkSend() {
  const subs = await EmailsService.entities.Subscriber.scan
    .where(({ confirmed }, { eq }) => `${eq(confirmed, true)}`)
    .go();
  return {
    count: subs.data.length,
  };
}

export const send = ApiHandler(async function (event) {
  const content = fm(event.body);
  const subs = await EmailsService.entities.Subscriber.scan
    .where(({ confirmed }, { eq }) => `${eq(confirmed, true)}`)
    .go();
  // TODO: better settings for concurrency, email deliverability, and scheduling
  for (const sub of subs.data) {
    await sendEmail({
      to: sub.email,
      subject: (content.attributes as any).Subject,
      html: marked.parse(content.body) as string,
    });
  }
});
