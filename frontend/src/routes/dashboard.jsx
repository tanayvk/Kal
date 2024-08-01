import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Fuse from "fuse.js";

const actions = [
  {
    title: "Create Email",
    text: "Create a new email.",
    route: "/create-email",
  },
  {
    title: "Emails",
    text: "View, edit and send emails.",
    route: "/emails",
  },
  {
    title: "Subscribers",
    text: "Manage subscribers.",
    route: "/subscribers",
  },
  {
    title: "Create Email Template",
    text: "Create a new email template.",
    route: "/create-template",
  },
  {
    title: "Email Templates",
    text: "Manage email templates.",
    route: "/templates",
  },
  {
    title: "Create Sender",
    text: "Create a new sender.",
    route: "/create-sender",
  },
  {
    title: "Senders",
    text: "View, edit and delete senders.",
    route: "/senders",
  },
  {
    title: "Configure SMTP Server",
    text: "Configure a new SMTP server.",
    route: "/create-smtp",
  },
  {
    title: "SMTP Servers",
    text: "Manage SMTP servers.",
    route: "/smtp",
  },
  {
    title: "Lists",
    text: "Manage lists.",
    route: "/lists",
  },
  {
    title: "Create List",
    text: "Create a new list.",
    route: "/create-list",
  },
  {
    title: "Settings",
    text: "Configure Kal settings.",
    route: "/settings",
  },
];

// TODO: show fuzzy matches in text
const fuse = new Fuse(actions, {
  keys: ["title", "text"],
  shouldSort: true,
  includeMatches: true,
});

export default function Dashboard() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const filteredActions = query
    ? fuse.search(query).map(({ item }) => item)
    : actions;
  return (
    <div className="flex-grow flex items-center justify-center">
      <div className="space-y-10 container px-4 md:px-0">
        <h1 className="text-4xl text-center">Email marketing made fast.</h1>
        <div className="overflow-scroll w-full md:w-2/3 2xl:w-1/2 mx-auto bg-neutral-800 rounded-lg border-2 border-neutral-600">
          <div>
            <input
              className="w-full bg-neutral-800 text-2xl my-2 px-3 py-2 outline-none border-none"
              type="text"
              placeholder="I want to..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="h-[1px] w-full mx-auto bg-neutral-700"></div>
          <div className="h-[50vh]  overflow-scroll divide-neutral-600 divide-y">
            {filteredActions.map((action) => (
              <div
                onClick={() => {
                  if (action.route) navigate(action.route);
                }}
                className="group flex flex-col cursor-pointer w-full py-1 px-3 hover:bg-gray-600/30"
              >
                <span className="group-hover:underline font-semibold text-lg">
                  {action.title}
                </span>
                <span className="text-md">{action.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
