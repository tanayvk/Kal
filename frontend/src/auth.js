import * as api from "./api";
import { createStore } from "./zustand";

const useAuth = createStore((set) => ({
  username: localStorage.getItem("username") || null,
  login: (username, token) => {
    if (username) {
      localStorage.setItem("username", username);
      localStorage.setItem("token", token);
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
}));

export const useLoggedIn = () => useAuth((state) => !!state.username);

export const login = async (username, password) => {
  try {
    const response = await api.login(username, password);
    if (!response.ok) {
      const { message } = await response.json();
      throw new Error(message || "Login failed.");
    }

    const { data: token } = await response.json();
    useAuth.getState().login(username, token);
  } catch (error) {
    throw new Error(error.message);
  }
};

export const logout = () => {
  useAuth.getState().logout();
};

export const useUsername = () => useAuth((state) => state.username);
