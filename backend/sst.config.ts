/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(_input) {
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
      handler: "app/core/emails.sender",
      link: [api, emailsTable],
      permissions: [
        {
          actions: ["secretsmanager:*"],
          resources: ["*"],
        },
      ],
    });

    // public
    api.route("POST /sub", {
      handler: "app/src/email.sub",
      link: [api, emailsTable],
    });
    api.route("GET /confirm_sub", {
      handler: "app/src/email.confirmSub",
      link: [api, emailsTable],
    });
    api.route("POST /unsub", {
      handler: "app/src/email.unsub",
      link: [api, emailsTable],
    });

    // sender auth
    api.route("POST /check_send", {
      handler: "app/src/email.checkSend",
      link: [api, emailsTable],
    });
    api.route("POST /send", {
      handler: "app/src/email.send",
      link: [api, topic, emailsTable],
    });
    api.route("POST /sender_config", {
      handler: "app/src/email.send",
      link: [api, topic, emailsTable],
    });

    new sst.aws.Cron("Sender", {
      job: {
        handler: "app/src/emails.sender",
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
