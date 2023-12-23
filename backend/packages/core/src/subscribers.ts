import { marked } from "marked";
import { Liquid } from "liquidjs";

import { EmailsService } from "./database";
import { sendEmail } from "./emails";

const engine = new Liquid();

const subscribeContent = `
Hey {{name}},

Thanks for subscribing to my newsletter!

There's just one more step to go.

Click on this link to confirm your subscription: [Confirm]({{ confirm_link }}).

Or you can just paste this link in the browser:
{{ confirm_link }}
`;

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
  const liquidTemplate = engine.parse(subscribeContent);
  const confirm_link = `${endpoint}/confirm_sub?id=${sub.data.subscriberId}`;
  const md = await engine.render(liquidTemplate, {
    name,
    confirm_link,
  });
  await sendEmail({
    to: email,
    subject: "Confirm your subscription to my newsletter!",
    html: marked.parse(md) as string,
  });
}

export async function confirmSubscriber(id: string) {
  await EmailsService.entities.Subscriber.update({ subscriberId: id })
    .set({
      confirmed: true,
    })
    .go();
}

export async function removeSubscriber(id: string) {
  await EmailsService.entities.Subscriber.delete({ subscriberId: id }).go();
}
