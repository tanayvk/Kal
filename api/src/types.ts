export type EmailMessagePayload = {
  subject: string;
  html: string;
  text: string;
};

export type SendingQueuePayload = {
  smtpServer: number;
  from: string;
  to: string;
  email: EmailMessagePayload;
};

export type SubscriberStatus = "subscribed" | "unsubscribed" | "unconfirmed";

type SendEmailEvent = {
  type: "SendEmail";
  sender: number;
  email: number;
  filter: string;
};

type ConfirmationEmailEvent = {
  type: "ConfirmationEmail";
  sub: number;
};

export type EventPayload = SendEmailEvent | ConfirmationEmailEvent;

export type EventType = "SendEmail" | "ConfirmationEmail";
