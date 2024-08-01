import { Link } from "react-router-dom";
import moment from "moment";
import { useMutation, useQueryClient } from "react-query";

import * as api from "@/api";
import Page from "@/components/Page";

function Templates() {
  const queryClient = useQueryClient();
  const { data } = api.useTemplates();
  const deleteMutation = useMutation(api.deleteEmail, {
    onMutate: async (id) => {
      await queryClient.cancelQueries("templates");
      const previousData = queryClient.getQueryData("templates");

      queryClient.setQueryData("templates", (oldData) => ({
        ...oldData,
        data: oldData.data.filter((temp) => temp.id !== id),
      }));

      return { previousData };
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData("templates", context.previousData);
    },
    onSettled: () => {
      queryClient.invalidateQueries("templates");
    },
  });
  const handleDelete = (id) => {
    deleteMutation.mutate(id);
  };
  if (!data?.data.length)
    return (
      <div className="h-[50vh] flex items-center justify-center gap-2">
        {"No email templates."}
        <Link className="link font-bold" to="/create-template">
          Create.
        </Link>
      </div>
    );
  const emails = data.data;
  return (
    <div className="w-full mx-auto space-y-2">
      {emails.map((email) => (
        <div className="py-2">
          <div className="flex items-center" key={email.id}>
            <div className="flex flex-col">
              <Link
                className="text-2xl font-semibold hover:underline"
                to={`/templates/${email.id}`}
              >
                {email.subject}
              </Link>
              <span className="text-md text-neutral-300/60">
                Updated {moment.utc(email.updatedAt).fromNow()}
              </span>
            </div>
            <div className="flex-grow"></div>
            <div className="space-x-2">
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

const ManageTemplates = () => {
  return (
    <Page
      title="Email Templates"
      actions={[
        <Link to="/create-template" className="link">
          Create
        </Link>,
      ]}
    >
      <Templates />
    </Page>
  );
};

export default ManageTemplates;
