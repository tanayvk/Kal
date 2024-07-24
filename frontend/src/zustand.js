import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export const createStore = (...args) => create(immer(...args));
