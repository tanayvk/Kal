import { SSTConfig } from "sst";
import { Main } from "./stacks/MyStack";

export default {
  config(_input) {
    return {
      name: "emails",
    };
  },
  stacks(app) {
    app.stack(Main);
  },
} satisfies SSTConfig;
