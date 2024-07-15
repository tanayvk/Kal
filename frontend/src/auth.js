import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

const useAuth = create(
  immer((set) => ({
    username: localStorage.getItem("username") || null,
    login: (username) => {
      if (username) {
        localStorage.setItem("username", username);
        set((state) => {
          state.username = username;
        });
      }
    },
    logout: () => {
      localStorage.removeItem("username");
      set((state) => {
        state.username = null;
      });
    },
  })),
);

export const useLoggedIn = () => useAuth((state) => !!state.username);

export const login = (username, password) => {
  useAuth.getState().login(username);
};

export const logout = () => {
  useAuth.getState().logout();
};

export const useUsername = () => useAuth((state) => state.username);
