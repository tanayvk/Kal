import { SSTConfig } from "sst";
import { Main } from "./stacks/MyStack";

export default {
  config(_input) {
    return {
      name: "emails",
      region: "ap-south-1",
    };
  },
  stacks(app) {
    app.stack(Main);
  },
} satisfies SSTConfig;
