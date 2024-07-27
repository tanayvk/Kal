import { useMutation, useQueryClient } from "react-query";
import { Link } from "react-router-dom";
import { useState } from "react";

import Input from "@/components/Input";
import Listbox from "@/components/Listbox";
import Page from "@/components/Page";
import { useConfig, updateConfig, useEmails, useSenders } from "@/api";

function Config() {
  const {
    data: { data: config },
  } = useConfig();
  const {
    data: { data: senders },
  } = useSenders();
  const {
    data: { data: emails },
  } = useEmails();

  const [updated, setUpdated] = useState(false);
  const [siteUrl, setSiteUrl] = useState(config.siteUrl || "");
  const [sender, setSender] = useState(
    config.defaultSender
      ? emails.find((sender) => sender.id === config.defaultSender)
      : null,
  );
  const [welcomeEmail, setWelcomeEmail] = useState(
    config.welcomeEmail
      ? emails.find((email) => email.id === config.welcomeEmail)
      : null,
  );
  const [confirmEmail, setConfirmEmail] = useState(
    config.welcomeEmail
      ? emails.find((email) => email.id === config.confirmationEmail)
      : null,
  );
  const [loading, setLoading] = useState(false);

  const queryClient = useQueryClient();
  const mutation = useMutation(updateConfig, {
    onSuccess: () => {
      queryClient.invalidateQueries("config");
      setUpdated(true);
    },
    onSettled: () => {
      setLoading(false);
    },
  });

  const handleSubmit = () => {
    const configData = {
      defaultSender: sender?.id,
      welcomeEmail: welcomeEmail?.id,
      siteUrl: siteUrl,
    };
    setLoading(true);
    mutation.mutate(configData);
  };

  return (
    <div>
      <div className="space-y-3">
        <Input
          label="Site URL"
          description="ex: https://mynewsletter.example.com"
          value={siteUrl}
          onChange={(e) => setSiteUrl(e.target.value)}
        />
        <Listbox
          label={
            <div className="flex space-x-2">
              <span>Default Sender</span>
              <span className="font-light link">
                <Link to="/create-sender">Create</Link>
              </span>
            </div>
          }
          description="The default sender is used to send welcome email and confirmation email."
          options={senders}
          displayFn={(sender) => sender.from}
          keyFn={(sender) => sender.id}
          valueFn={(sender) => sender}
          onChange={setSender}
          selected={sender}
          emptyText="No senders."
          defaultText="Select Sender"
        />
        <Listbox
          label={
            <div className="flex space-x-2">
              <span>Confirmation Email</span>
            </div>
          }
          description="The confirmation email is sent to a new subscriber to confirm their opt-in."
          options={emails}
          displayFn={(email) => email.subject}
          keyFn={(email) => email.id}
          valueFn={(email) => email}
          onChange={setConfirmEmail}
          selected={confirmEmail}
          emptyText="No emails."
          defaultText="Select Confirmation Email"
        />
        <Listbox
          label={
            <div className="flex space-x-2">
              <span>Welcome Email</span>
            </div>
          }
          description="The welcome email is sent whenever a new subscriber subscribes."
          options={emails}
          displayFn={(email) => email.subject}
          keyFn={(email) => email.id}
          valueFn={(email) => email}
          onChange={setWelcomeEmail}
          selected={welcomeEmail}
          emptyText="No emails."
          defaultText="Select Welcome Email"
        />
      </div>
      <div className="mt-6 flex gap-2">
        {loading ? (
          <span>Updating...</span>
        ) : (
          <button className="link" onClick={handleSubmit}>
            Update Settings
          </button>
        )}
        {!loading && updated && <span className="text-gray-400">Updated.</span>}
      </div>
    </div>
  );
}

const Settings = () => {
  return (
    <Page title="Settings">
      <Config />
    </Page>
  );
};

export default Settings;
