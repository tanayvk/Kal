import React from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  redirect,
} from "react-router-dom";

import { logout, useLoggedIn } from "./auth";
import Root from "./routes/root";
import Dashboard from "./routes/dashboard";
import Login from "./routes/login";

import "./index.css";

function Router() {
  const loggedIn = useLoggedIn();
  const authLoader = () => loggedIn || redirect("/login");
  const guestLoader = () => loggedIn && redirect("/dashboard");
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Root />,
      children: [
        { path: "/", loader: () => redirect("/dashboard") },
        {
          path: "/logout",
          loader: () => {
            logout();
            return redirect("/");
          },
          element: <Login />,
        },
        { path: "/dashboard", loader: authLoader, element: <Dashboard /> },
      ],
    },
    { path: "/login", loader: guestLoader, element: <Login /> },
  ]);
  return <RouterProvider router={router} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>,
);
