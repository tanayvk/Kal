import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "react-query";

import Input from "@/components/Input";
import Switch from "@/components/Switch";
import Listbox from "@/components/Listbox";
import Button from "@/components/Button";
import { useConfig, useSmtpServers, updateSender, createSender } from "@/api";

const EditSender = ({ sender }) => {
  const navigate = useNavigate();
  const {
    data: { data: config },
  } = useConfig();
  const { data: smtpServersData } = useSmtpServers();
  const smtpServers = smtpServersData?.data || [];
  const [from, setFrom] = useState(sender?.from || "");
  const [server, setServer] = useState(
    sender?.smtpServer
      ? smtpServers.find((server) => server.id === sender.smtpServer)
      : null,
  );
  const [isDefault, setIsDefault] = useState(
    sender
      ? sender.id === config.defaultSender
      : config.defaultSender
      ? false
      : true,
  );
  const [loading, setLoading] = useState(false);

  const queryClient = useQueryClient();
  const mutation = useMutation(sender ? updateSender : createSender, {
    onSuccess: () => {
      queryClient.invalidateQueries("senders");
      navigate("/senders");
    },
    onSettled: () => {
      setLoading(false);
    },
  });

  const handleSubmit = () => {
    const senderData = {
      from,
      smtpServer: server?.id,
      isDefault,
    };
    setLoading(true);
    if (sender) {
      mutation.mutate({ id: sender.id, senderData });
    } else {
      mutation.mutate(senderData);
    }
  };

  return (
    <div>
      <div className="space-y-3">
        <Input
          label="From"
          description="ex: John Doe <johndoe@example.com>"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
        <Listbox
          label={
            <div className="flex space-x-2">
              <span>SMTP Server</span>
              <span className="font-light link">
                <Link to="/create-smtp">Create</Link>
              </span>
            </div>
          }
          description="Choose an SMTP server that will be used to send emails for this sender."
          options={smtpServers}
          displayFn={(server) =>
            `${server?.smtpConfig?.host}: ${server?.smtpConfig?.username}`
          }
          keyFn={(server) => server.id}
          valueFn={(server) => server}
          onChange={setServer}
          selected={server}
          emptyText="No SMTP Servers configured."
          defaultText="Select SMTP Server"
        />
        <Switch
          enabled={isDefault}
          setEnabled={setIsDefault}
          label="Set Default"
          description="The default sender is used for confirmation and other admin emails."
        />
      </div>
      <div className="mt-6">
        <Button onClick={handleSubmit} loading={loading}>
          {sender ? "Update" : "Create"}
        </Button>
      </div>
    </div>
  );
};

export default EditSender;
