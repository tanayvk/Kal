import { Link } from "react-router-dom";
import moment from "moment";
import { useMutation, useQueryClient } from "react-query";

import * as api from "@/api";
import Page from "@/components/Page";

function SMTPList() {
  const queryClient = useQueryClient();
  const { data } = api.useSmtpServers();
  const deleteMutation = useMutation(api.deleteSmtpServer, {
    onMutate: async (id) => {
      await queryClient.cancelQueries("smtpServers");
      const previousData = queryClient.getQueryData("smtpServers");

      queryClient.setQueryData("smtpServers", (oldData) => ({
        ...oldData,
        data: oldData.data.filter((server) => server.id !== id),
      }));

      return { previousData };
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData("smtpServers", context.previousData);
    },
    onSettled: () => {
      queryClient.invalidateQueries("smtpServers");
    },
  });
  const handleDelete = (id) => {
    deleteMutation.mutate(id);
  };
  if (!data?.data.length)
    return (
      <div className="h-[50vh] flex items-center justify-center gap-2">
        {"No SMTP servers configured."}
        <Link className="link font-bold" to="/create-smtp">
          Create.
        </Link>
      </div>
    );
  const servers = data.data;
  return (
    <div className="w-full h-[80vh] overflow-scroll mx-auto space-y-2">
      {servers.map((server) => (
        <div className="py-2">
          <div className="flex items-center" key={server.id}>
            <div className="flex flex-col">
              <Link
                className="text-2xl font-semibold hover:underline"
                to={`/smtp/${server.id}`}
              >
                {server.smtpConfig?.host}
                <span className="text-md text-neutral-300/60">
                  {" " + server.smtpConfig?.username}
                </span>
              </Link>
              <span className="text-md text-neutral-300/60">
                Created {moment.utc(server.createdAt).fromNow()}
              </span>
            </div>
            <div className="flex-grow"></div>
            <div className="space-x-2">
              <a
                onClick={() => handleDelete(server.id)}
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

const ManageSMTP = () => {
  return (
    <Page
      title="SMTP Servers"
      actions={[
        <Link to="/create-smtp" className="link">
          Create
        </Link>,
      ]}
    >
      <SMTPList />
    </Page>
  );
};

export default ManageSMTP;
