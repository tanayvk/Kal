import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { v4 as uuid_v4 } from "uuid";
import { Entity, Service } from "electrodb";
import { CreateEntityResponse } from "electrodb/index";
import { Resource } from "sst";

const dynamodb = new DynamoDBClient();

const Subscriber = new Entity({
  model: {
    entity: "subscriber",
    version: "1",
    service: "emails",
  },
  attributes: {
    subscriberId: {
      type: "string",
      default: () => uuid_v4(),
      required: true,
    },
    email: {
      type: "string",
      required: true,
    },
    name: {
      type: "string",
      required: true,
    },
    createdAt: {
      type: "number",
      default: new Date().getTime(),
      readOnly: true,
    },
    confirmed: {
      type: "boolean",
      default: false,
    },
    unsubscribed: {
      type: "boolean",
      default: false,
    },
  },
  indexes: {
    subscriber: {
      pk: {
        field: "pk",
        composite: ["subscriberId"],
      },
      sk: {
        field: "sk",
        composite: [],
      },
    },
  },
});

const Email = new Entity({
  model: {
    entity: "email",
    version: "1",
    service: "emails",
  },
  attributes: {
    emailId: {
      type: "string",
      default: () => uuid_v4(),
      required: true,
    },
    from: {
      type: "string",
      required: false,
    },
    to: {
      type: "string",
      required: true,
    },
    subscriberId: {
      type: "string",
      required: true,
    },
    eventId: {
      type: "string",
      required: true,
    },
    createdAt: {
      type: "number",
      default: new Date().getTime(),
      readOnly: true,
      required: true,
    },
    time: {
      type: "number",
      default: 0, // send right away
    },
    status: {
      type: ["pending", "sent", "failed"],
      default: "pending",
    },
    retries: {
      type: "number",
      default: 0,
    },
  },
  indexes: {
    email: {
      pk: {
        field: "pk",
        composite: ["emailId"],
      },
      sk: {
        field: "sk",
        composite: [],
      },
    },
    bySent: {
      index: "gs1",
      pk: {
        field: "gsi1pk",
        composite: ["status"],
      },
      sk: {
        field: "gsi1sk",
        composite: ["time"],
      },
    },
  },
});

const Event = new Entity({
  model: {
    entity: "event",
    version: "1",
    service: "emails",
  },
  attributes: {
    eventId: {
      type: "string",
      default: () => uuid_v4(),
      required: true,
    },
    from: {
      type: "string",
      required: false,
    },
    payload: {
      type: "any",
      required: true,
    },
    createdAt: {
      type: "number",
      default: new Date().getTime(),
      readOnly: true,
    },
    time: {
      type: "number",
    },
  },
  indexes: {
    event: {
      pk: {
        field: "pk",
        composite: ["eventId"],
      },
      sk: {
        field: "sk",
        composite: [],
      },
    },
  },
});

export const EmailsService = new Service(
  { Subscriber, Email, Event },
  { client: dynamodb, table: Resource.Main.name },
);

export type EmailResponse = CreateEntityResponse<typeof Email>;
