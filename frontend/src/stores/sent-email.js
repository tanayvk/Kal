import { createStore } from "@/zustand";

const usePage = createStore((set) => ({
  sent: null,
  setSentEmails: (sent) => {
    set((state) => {
      state.sent = sent;
    });
  },
}));

export const useSentEmails = () => usePage((state) => state.sent);

export const getSentEmails = () => usePage.getState().sent;

export const setSentEmails = (sent) => usePage.getState().setSentEmails(sent);
