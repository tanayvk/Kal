import { createStore } from "@/zustand";

const usePage = createStore((set) => ({
  title: "",
  setTitle: (title) => {
    set((state) => {
      state.title = title;
    });
  },
}));

export const usePageTitle = () => usePage((state) => state.title);

export const getPageTitle = () => usePage.getState().title;

export const setPageTitle = (title) => usePage.getState().setTitle(title);
