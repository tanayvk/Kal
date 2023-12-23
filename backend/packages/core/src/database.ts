import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { v4 as uuid_v4 } from "uuid";
import { Entity, Service } from "electrodb";
import { Table } from "sst/node/table";

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

export const EmailsService = new Service(
  { Subscriber },
  { client: dynamodb, table: (Table as any).emails.tableName },
);
