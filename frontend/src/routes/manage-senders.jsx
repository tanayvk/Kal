import { Link } from "react-router-dom";
import moment from "moment";
import { useMutation, useQueryClient } from "react-query";

import * as api from "@/api";
import Page from "@/components/Page";

function SendersList() {
  const { data } = api.useSenders();
  const queryClient = useQueryClient();
  const deleteMutation = useMutation(api.deleteSender, {
    onMutate: async (id) => {
      await queryClient.cancelQueries("senders");
      const previousData = queryClient.getQueryData("senders");

      queryClient.setQueryData("senders", (oldData) => ({
        ...oldData,
        data: oldData.data.filter((sender) => sender.id !== id),
      }));

      return { previousData };
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData("senders", context.previousData);
    },
    onSettled: () => {
      queryClient.invalidateQueries("senders");
    },
  });
  if (!data?.data.length)
    return (
      <div className="h-[50vh] flex items-center justify-center gap-2">
        {"No senders."}
        <Link className="link font-bold" to="/create-sender">
          Create.
        </Link>
      </div>
    );
  const handleDelete = (id) => {
    deleteMutation.mutate(id);
  };
  if (!data?.data.length)
    return (
      <div className="h-[50vh] flex items-center justify-center gap-2">
        {"No senders.."}
        <Link className="link font-bold" to="/create-smtp">
          Create.
        </Link>
      </div>
    );
  const senders = data.data;
  return (
    <div className="w-full h-[80vh] overflow-scroll mx-auto space-y-2">
      {senders.map((sender) => (
        <div className="py-2">
          <div className="flex items-center" key={sender.id}>
            <div className="flex flex-col">
              <Link
                className="text-2xl font-semibold hover:underline"
                to={`/senders/${sender.id}`}
              >
                {sender.from}
              </Link>
              <span className="text-md text-neutral-300/60">
                Created {moment.utc(sender.createdAt).fromNow()}
              </span>
            </div>
            <div className="flex-grow"></div>
            <div className="space-x-2">
              <a
                onClick={() => handleDelete(sender.id)}
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

const ManageSenders = () => {
  return (
    <Page title="Manage Senders">
      <SendersList />
    </Page>
  );
};

export default ManageSenders;
