import { ApiHandler, useJsonBody } from "sst/node/api";

import {
  addSubscriber,
  broadcast,
  confirmSubscriber,
  getSubscriberCount,
  removeSubscriber,
} from "@email-marketing/core/src/subscribers";

// TODO: add validation and error handling
export const sub = ApiHandler(async function (event) {
  const endpoint = ("https://" + event.headers.host) as string;
  const body = useJsonBody();
  const sub = await addSubscriber({
    name: body.name,
    email: body.email,
    confirmed: !!body.confirmed,
    endpoint,
  });
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id: sub.data.subscriberId }),
  };
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
  return {
    count: await getSubscriberCount(),
  };
}

export const send = ApiHandler(async function (event) {
  const endpoint = ("https://" + event.headers.host) as string;
  await broadcast(event.body as string, endpoint);
});
