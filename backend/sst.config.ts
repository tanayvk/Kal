/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "Emails",
      home: "aws",
    };
  },
  async run() {
    const emailsTable = new sst.aws.Dynamo("Main", {
      fields: {
        pk: "string",
        sk: "string",
        gsi1pk: "string",
        gsi1sk: "string",
        gsi2pk: "string",
        gsi2sk: "string",
      },
      primaryIndex: { hashKey: "pk", rangeKey: "sk" },
      globalIndexes: {
        gs1: {
          hashKey: "gsi1pk",
          rangeKey: "gsi1sk",
        },
        gs2: {
          hashKey: "gsi2pk",
          rangeKey: "gsi2sk",
        },
      },
    });

    const api = new sst.aws.ApiGatewayV2("Api", {
      transform: {
        api: {
          corsConfiguration: {
            allowCredentials: false,
            allowHeaders: ["Authorization"],
            allowMethods: ["OPTIONS", "POST", "GET", "PUT", "DELETE"],
            allowOrigins: ["*"],
            exposeHeaders: [],
            maxAge: 0,
          },
        },
      },
    });
    const topic = new sst.aws.SnsTopic("SendEmailTopic");
    topic.subscribe({
      handler: "packages/core/src/emails.sender",
      link: [api, emailsTable],
      permissions: [
        {
          actions: ["secretsmanager:*"],
          resources: ["*"],
        },
      ],
    });
    api.route("POST /sub", {
      handler: "packages/functions/src/email.sub",
      link: [api, emailsTable],
    });
    api.route("GET /confirm_sub", {
      handler: "packages/functions/src/email.confirmSub",
      link: [api, emailsTable],
    });
    api.route("POST /unsub", {
      handler: "packages/functions/src/email.unsub",
      link: [api, emailsTable],
    });
    api.route("POST /check_send", {
      handler: "packages/functions/src/email.checkSend",
      link: [api, emailsTable],
    });
    api.route("POST /send", {
      handler: "packages/functions/src/email.send",
      link: [api, topic, emailsTable],
    });

    new sst.aws.Cron("Sender", {
      job: {
        handler: "packages/core/src/emails.sender",
        link: [api, emailsTable],
        permissions: [
          {
            actions: ["secretsmanager:*"],
            resources: ["*"],
          },
        ],
      },
      schedule: "cron(*/30 10 * * ? *)",
    });
  },
});
