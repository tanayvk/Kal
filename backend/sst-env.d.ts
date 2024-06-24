/* tslint:disable */
/* eslint-disable */
import "sst"
declare module "sst" {
  export interface Resource {
    Api: {
      type: "sst.aws.ApiGatewayV2"
      url: string
    }
    Main: {
      name: string
      type: "sst.aws.Dynamo"
    }
  }
}
export {}