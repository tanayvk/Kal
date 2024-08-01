import React from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  redirect,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0,
      suspense: true,
    },
  },
});

import "./index.css";
import { logout, useLoggedIn } from "@/stores/auth";
import Root from "./routes/root";
import Dashboard from "./routes/dashboard";
import CreateEmail from "./routes/create-email";
import Login from "./routes/login";
import ManageSenders from "./routes/manage-senders";
import ManageSMTP from "./routes/manage-smtp";
import ManageEmails from "./routes/manage-emails";
import ManageLists from "./routes/manage-lists";
import ManageTemplates from "./routes/manage-templates";
import CreateSender from "./routes/create-sender";
import CreateSMTP from "./routes/create-smtp";
import CreateList from "./routes/create-list";
import CreateTemplate from "./routes/create-template";
import EditSender from "./routes/edit-sender";
import EditSMTP from "./routes/edit-smtp";
import EditEmail from "./routes/edit-email";
import EditList from "./routes/edit-list";
import EditTemplate from "./routes/edit-template";
import SendEmail from "./routes/send-email";
import Subscribe from "./routes/subscribe";
import Subscribers from "./routes/subscribers";
import Settings from "./routes/settings";

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
        { path: "/create-email", loader: authLoader, element: <CreateEmail /> },
        {
          path: "/senders",
          loader: authLoader,
          element: <ManageSenders />,
        },
        {
          path: "/smtp",
          loader: authLoader,
          element: <ManageSMTP />,
        },
        {
          path: "/emails",
          loader: authLoader,
          element: <ManageEmails />,
        },
        {
          path: "/create-sender",
          loader: authLoader,
          element: <CreateSender />,
        },
        {
          path: "/create-smtp",
          loader: authLoader,
          element: <CreateSMTP />,
        },
        {
          path: "/smtp/:id",
          loader: authLoader,
          element: <EditSMTP />,
        },
        {
          path: "/senders/:id",
          loader: authLoader,
          element: <EditSender />,
        },
        {
          path: "/emails/:id",
          loader: authLoader,
          element: <EditEmail />,
        },
        {
          path: "/emails/:id/send",
          loader: authLoader,
          element: <SendEmail />,
        },
        {
          path: "/subscribers",
          loader: authLoader,
          element: <Subscribers />,
        },
        {
          path: "/settings",
          loader: authLoader,
          element: <Settings />,
        },
        {
          path: "/create-template",
          loader: authLoader,
          element: <CreateTemplate />,
        },
        {
          path: "/templates",
          loader: authLoader,
          element: <ManageTemplates />,
        },
        {
          path: "/templates/:id",
          loader: authLoader,
          element: <EditTemplate />,
        },
        {
          path: "/create-list",
          loader: authLoader,
          element: <CreateList />,
        },
        {
          path: "/lists",
          loader: authLoader,
          element: <ManageLists />,
        },
        {
          path: "/lists/:id",
          loader: authLoader,
          element: <EditList />,
        },
      ],
    },
    { path: "/login", loader: guestLoader, element: <Login /> },
    { path: "/subscribe", element: <Subscribe /> },
  ]);
  return <RouterProvider router={router} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Router />
    </QueryClientProvider>
  </React.StrictMode>,
);
