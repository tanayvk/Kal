// TODO: actions
//
// send an email
// manage senders
// create sender
// view analytics
// settings

const actions = [
  {
    category: "Emails",
    text: "Create a new email.",
  },
  {
    category: "Emails",
    text: "Send an email.",
  },
  {
    category: "Senders",
    text: "Create a new sender.",
  },
  {
    category: "Senders",
    text: "Manage senders.",
  },
  {
    category: "SMTP",
    text: "Configure a new SMTP server.",
  },
  {
    category: "SMTP",
    text: "Manage SMTP servers.",
  },
  {
    category: "Templates",
    text: "Create a new email template.",
  },
  {
    category: "Templates",
    text: "Manage email templates.",
  },
];

export default function Dashboard() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex flex-col gap-10 container px-4 md:px-0">
        <h1 class="text-4xl text-center">Email marketing made fast.</h1>
        <div class="flex flex-col w-full md:w-2/3 2xl:w-1/2 mx-auto bg-neutral-800 rounded-lg border-2 border-neutral-600">
          <div>
            <input
              className="w-full bg-neutral-800 text-2xl my-2 px-3 py-2 outline-none border-none"
              type="text"
              placeholder="I want to..."
            />
          </div>
          <div className="divide-neutral-600 divide-y">
            {actions.map((action) => (
              <div className="group flex flex-col cursor-pointer w-full py-1 px-3 hover:bg-gray-600/30">
                <span className="group-hover:underline font-semibold text-lg">
                  {action.category}
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
