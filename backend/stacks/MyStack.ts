import { StackContext, Api, Table } from "sst/constructs";

export function Main({ stack }: StackContext) {
  const emailsTable = new Table(stack, "emails", {
    fields: {
      pk: "string",
      sk: "string",
      gsi1pk: "string",
      gsi1sk: "string",
      gsi2pk: "string",
      gsi2sk: "string",
    },
    primaryIndex: { partitionKey: "pk", sortKey: "sk" },
    globalIndexes: {
      gs1: {
        partitionKey: "gsi1pk",
        sortKey: "gsi1sk",
      },
      gs2: {
        partitionKey: "gsi2pk",
        sortKey: "gsi2sk",
      },
    },
  });

  const api = new Api(stack, "api", {
    cors: true,
    defaults: {
      function: {
        bind: [emailsTable],
        permissions: ["secretsmanager"],
      },
    },
    routes: {
      // public
      "POST /sub": "packages/functions/src/email.sub",
      "GET /confirm_sub": "packages/functions/src/email.confirmSub",
      "GET /unsub": "packages/functions/src/email.unsub",

      // auth
      "GET /check_send": "packages/functions/src/email.checkSend",
      "POST /send": "packages/functions/src/email.send",
    },
  });

  stack.addOutputs({
    apiUrl: api.url,
  });
}
