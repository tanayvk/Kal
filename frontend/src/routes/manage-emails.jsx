import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "react-query";
import moment from "moment";

import * as api from "@/api";
import Page from "@/components/Page";

function EmailsList() {
  const { data } = api.useEmails();
  const queryClient = useQueryClient();
  const deleteMutation = useMutation(api.deleteEmail, {
    onMutate: async (id) => {
      await queryClient.cancelQueries("emails");
      const previousData = queryClient.getQueryData("emails");

      queryClient.setQueryData("emails", (oldData) => ({
        ...oldData,
        data: oldData.data.filter((email) => email.id !== id),
      }));

      return { previousData };
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData("emails", context.previousData);
    },
    onSettled: () => {
      queryClient.invalidateQueries("emails");
    },
  });
  if (!data?.data.length)
    return (
      <div className="h-[50vh] flex items-center justify-center gap-2">
        {"No emails."}
        <Link className="link font-bold" to="/create-email">
          Create.
        </Link>
      </div>
    );
  const handleDelete = (id) => {
    deleteMutation.mutate(id);
  };
  const emails = data.data;
  return (
    <div className="divide-y divide-neutral-700 w-full h-[80vh] overflow-scroll mx-auto">
      {emails.map((email) => (
        <div className="py-2">
          <div className="flex items-center" key={email.id}>
            <div className="flex flex-col">
              <Link
                className="text-2xl font-semibold hover:underline"
                to={`/emails/${email.id}`}
              >
                {email.subject}
              </Link>
              <span className="text-md text-neutral-300/60">
                Updated {moment.utc(email.updatedAt).fromNow()}
              </span>
            </div>
            <div className="flex-grow"></div>
            <div className="space-x-2">
              <Link
                to={`/emails/${email.id}/send`}
                className="link text-green-500 hover:text-green-400"
              >
                Send
              </Link>
              <a
                onClick={() => handleDelete(email.id)}
                className="link text-red-500 hover:text-red-400"
              >
                Delete
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const ManageEmails = () => {
  return (
    <Page title="Emails">
      <EmailsList />
    </Page>
  );
};

export default ManageEmails;
