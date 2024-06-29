import fm from "front-matter";

import {
  addSubscriber,
  broadcast,
  confirmSubscriber,
  getSubscriberCount,
  removeSubscriber,
} from "@email-marketing/core/src/subscribers";

// TODO: add validation and error handling
export const sub = async function (event: any) {
  const body = JSON.parse(event.body);
  const sub = await addSubscriber({
    name: body.name,
    email: body.email,
    confirmed: !!body.confirmed,
  });
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id: sub.data.subscriberId }),
  };
};

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

export async function checkSend(event: any) {
  return await broadcast(event.body as string, true);
}

export const send = async function (event: any) {
  return await broadcast(event.body as string, false);
};
