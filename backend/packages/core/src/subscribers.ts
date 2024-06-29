import { marked } from "marked";
import { Liquid } from "liquidjs";

import {
  EmailResponse as CreateEmailResponse,
  EmailsService,
} from "./database";
import { sendEmail } from "./emails";
import { Resource } from "sst";
import { getSubscribers } from "./utils";
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { compileExpression } from "filtrex";
import { getFilter } from "./filter";

const engine = new Liquid();

const snsClient = new SNSClient();

const confirmSubTemplateContent = `
Hey {{name}},

Thanks for subscribing to my newsletter!

There's just one more step to go.

Click on this link to confirm your subscription: [Confirm]({{ confirm_link }}).

Or you can just paste this link in the browser:
{{ confirm_link }}
`;
const confirmSubTemplate = engine.parse(confirmSubTemplateContent);

type AddSubscriberInput = {
  name: string;
  email: string;
  confirmed?: boolean;
};
export async function addSubscriber({
  name,
  email,
  confirmed,
}: AddSubscriberInput) {
  // TODO: basic validations to filter out nonsense emails
  const sub = await EmailsService.entities.Subscriber.create({
    email,
    name,
    confirmed,
  }).go();
  if (!confirmed) {
    const confirm_link = `${Resource.Api.url}/confirm_sub?id=${sub.data.subscriberId}`;
    const md = await engine.render(confirmSubTemplate, {
      name,
      confirm_link,
    });
    await sendEmail({
      to: email,
      subject: "Confirm your subscription to my newsletter!",
      html: marked.parse(md) as string,
    });
  }
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

export async function broadcast(email: string, dry: boolean) {
  // TODO: validation and errors?
  const emailObj = JSON.parse(email);
  const time = new Date(emailObj.time).getTime() || 0;
  let filter;
  try {
    filter = getFilter(emailObj.filter);
  } catch (err) {
    console.log("invalid filter", err);
    return {
      error: "Invalid filter.",
    };
  }
  // rename to send email
  const createEvent = EmailsService.entities.Event.create({
    payload: emailObj,
    time,
  });
  let event: CreateEmailResponse | null = null;
  if (!dry) {
    event = await createEvent.go();
  }
  const subs = await getSubscribers();
  const createEmails = [];
  for (const sub of subs) {
    if (!filter({ name: sub.name, sub })) continue;
    createEmails.push(
      EmailsService.entities.Email.create({
        to: sub.email,
        subscriberId: sub.subscriberId,
        eventId: event ? event.data.eventId : "dryRun",
        time,
      }),
    );
  }
  if (!dry) {
    await Promise.all(createEmails.map((email) => email.go()));
    await snsClient.send(
      new PublishCommand({
        TopicArn: Resource.SendEmailTopic.arn,
        Message: new Date().toString(),
      }),
    );
  }
  return {
    count: createEmails.length,
  };
}
