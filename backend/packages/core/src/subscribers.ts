import { marked } from "marked";
import { Liquid } from "liquidjs";
import fm from "front-matter";

import { EmailsService } from "./database";
import { sendEmail } from "./emails";

const engine = new Liquid();

const confirmSubTemplateContent = `
Hey {{name}},

Thanks for subscribing to my newsletter!

There's just one more step to go.

Click on this link to confirm your subscription: [Confirm]({{ confirm_link }}).

Or you can just paste this link in the browser:
{{ confirm_link }}
`;
const confirmSubTemplate = engine.parse(confirmSubTemplateContent);

export async function addSubscriber(
  name: string,
  email: string,
  endpoint: string,
) {
  // TODO: basic validations to filter out nonsense emails
  const sub = await EmailsService.entities.Subscriber.create({
    email,
    name,
  }).go();
  const confirm_link = `${endpoint}/confirm_sub?id=${sub.data.subscriberId}`;
  const md = await engine.render(confirmSubTemplate, {
    name,
    confirm_link,
  });
  await sendEmail({
    to: email,
    subject: "Confirm your subscription to my newsletter!",
    html: marked.parse(md) as string,
  });
  return sub;
}

export async function confirmSubscriber(id: string) {
  await EmailsService.entities.Subscriber.update({ subscriberId: id })
    .set({
      confirmed: true,
    })
    .go();
}

export async function removeSubscriber(id: string) {
  await EmailsService.entities.Subscriber.update({ subscriberId: id })
    .set({ unsubscribed: true })
    .go();
}

async function getSubscribers() {
  const subs = await EmailsService.entities.Subscriber.scan
    .where(({ confirmed }, { eq }) => `${eq(confirmed, true)}`)
    .go({ pages: "all" });
  return subs.data.filter((sub) => !sub.unsubscribed);
}

export async function getSubscriberCount(): Promise<number> {
  const subs = await getSubscribers();
  return subs.length;
}

export async function broadcast(email: string, endpoint: string) {
  // TODO: validation?
  const template = engine.parse(email);
  const subs = await getSubscribers();
  for (const sub of subs) {
    // TODO: let's format the sub data in the template better
    const content = fm(
      await engine.render(template, {
        sub,
        unsubscribe_link: `${endpoint}/unsub?id=${sub.subscriberId}`,
      }),
    );
    // TODO: better settings for concurrency, email deliverability, and scheduling
    await sendEmail({
      to: sub.email,
      subject: (content.attributes as any).Subject,
      html: marked.parse(content.body) as string,
    });
  }
}
