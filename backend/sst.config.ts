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
        route: {
          handler: {
            link: [emailsTable],
            permissions: [
              {
                actions: ["secretsmanager:*"],
                resources: ["*"],
              },
            ],
          },
        },
      },
    });
    api.route("POST /sub", "packages/functions/src/email.sub");
    api.route("GET /confirm_sub", "packages/functions/src/email.confirmSub");
    api.route("POST /unsub", "packages/functions/src/email.unsub");
    api.route("GET /check_send", "packages/functions/src/email.checkSend");
    api.route("POST /send", "packages/functions/src/email.send");
  },
});
