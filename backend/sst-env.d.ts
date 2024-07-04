/* tslint:disable */
/* eslint-disable */
import "sst"
declare module "sst" {
  export interface Resource {
    Api: {
      type: "sst.aws.ApiGatewayV2"
      url: string
    }
    JwtSecret: {
      type: "sst.sst.Secret"
      value: string
    }
    Main: {
      name: string
      type: "sst.aws.Dynamo"
    }
    SendEmailTopic: {
      arn: string
      type: "sst.aws.SnsTopic"
    }
  }
}
export {}