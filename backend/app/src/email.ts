import fm from "front-matter";
import { verify as verifyJwt } from "jsonwebtoken";
import { Resource } from "sst";

import {
  addSubscriber,
  broadcast,
  confirmSubscriber,
  removeSubscriber,
} from "../core/subscribers";
import { EmailsService } from "../core/database";

// TODO: switch to Hono
const getSenderId = async (event: any) => {
  const authorization =
    event.headers.Authorization || event.headers.authorization;
  const token = authorization.match(/Bearer (.*)/)?.[1];
  console.log("authorization", authorization, token);
  const payload = await verifyJwt(token, Resource.JwtSecret.value);
  console.log("payload", payload);
  const senderId = payload.senderId;
  if (!senderId) {
    throw new Error("No senderId.");
  }
  return payload.senderId;
};

const checkSenderAuth = async (event: any) => {
  const senderId = await getSenderId(event);
  const sender = await EmailsService.entities.Sender.get({
    senderId: senderId,
  }).go();
  if (!sender?.data) {
    throw new Error("Sender not found.");
  }
  return sender.data;
};

// TODO: add validation and error handling
// prevent duplicate emails
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
  const sender = await checkSenderAuth(event);
  return await broadcast(sender, event.body as string, true);
}

export const send = async function (event: any) {
  const sender = await checkSenderAuth(event);
  return await broadcast(sender, event.body as string, false);
};

export const senderConfig = async function (event: any) {
  const senderId = await getSenderId(event);
  await EmailsService.entities.Sender.put({
    senderId,
    creds: JSON.parse(event.body).creds,
  }).go();
  return {};
};

export const getStatus = async function (_event: any) {
  return {};
};

export const getSender = async function (event: any) {
  const senderId = await getSenderId(event);
  const sender = await EmailsService.entities.Sender.get({
    senderId: senderId,
  }).go();
  console.log("sender", sender.data);
  return {
    senderId,
    creds: sender.data?.creds,
  };
};
