import { useState } from "react";
import { useMutation, useQueryClient } from "react-query";

import Input from "@/components/Input";
import * as api from "@/api";
import { useNavigate } from "react-router-dom";

const EditSMTP = ({ smtpServer }) => {
  const navigate = useNavigate();
  const [host, setHost] = useState(smtpServer?.smtpConfig.host || "");
  const [port, setPort] = useState(smtpServer?.smtpConfig.port || "");
  const [username, setUsername] = useState(
    smtpServer?.smtpConfig.username || "",
  );
  const [password, setPassword] = useState(
    smtpServer?.smtpConfig.password || "",
  );
  const [loading, setLoading] = useState(false);

  const queryClient = useQueryClient();
  const mutation = useMutation(
    smtpServer ? api.updateSmtpServer : api.createSmtpServer,
    {
      onSuccess: () => {
        queryClient.invalidateQueries("smtpServers");
        if (!smtpServer) navigate("/smtp");
      },
      onSettled: () => {
        setLoading(false);
      },
    },
  );

  const handleSubmit = () => {
    const smtpConfig = {
      host,
      port,
      username,
      password,
    };
    setLoading(true);
    if (smtpServer) {
      mutation.mutate({ id: smtpServer.id, smtpConfig });
    } else {
      mutation.mutate(smtpConfig);
    }
  };

  return (
    <div>
      <div className="space-y-3">
        <div className="grid grid-cols-4 gap-2">
          <div className="col-span-3">
            <Input
              label="Host"
              description="ex: smtp-mail.outlook.com"
              value={host}
              onChange={(e) => setHost(e.target.value)}
            />
          </div>
          <Input
            label="Port"
            description="ex: 587"
            value={port}
            onChange={(e) => setPort(e.target.value)}
          />
        </div>
        <Input
          label="Username"
          description="SMTP Username."
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Input
          type="password"
          label="Password"
          description="SMTP Password."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="mt-6">
        {loading ? (
          <span>{smtpServer ? "Updating..." : "Creating..."}</span>
        ) : (
          <button className="link" onClick={handleSubmit}>
            {smtpServer ? "Update" : "Create"}
          </button>
        )}
      </div>
    </div>
  );
};

export default EditSMTP;
