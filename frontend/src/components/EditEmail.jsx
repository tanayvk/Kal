import { createEmail, updateEmail } from "../api";
import { useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import { useNavigate } from "react-router-dom";

import Input from "@/components/Input";
import Textarea from "@/components/Textarea";

export default function EditEmail({ email }) {
  const [type, setType] = useState("");
  const [subject, setSubject] = useState(email?.subject || "");
  const [body, setBody] = useState(email?.body || "");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const queryClient = useQueryClient();
  const mutation = useMutation(email ? updateEmail : createEmail, {
    onSuccess: () => {
      queryClient.invalidateQueries("emails");
      // TODO: navigate to that email with id from response??
      if (!email) navigate("/emails");
    },
    onSettled: () => {
      setLoading(false);
    },
  });

  const handleSubmit = () => {
    const emailData = {
      type,
      subject,
      body,
    };
    setLoading(true);
    if (email) {
      mutation.mutate({ id: email.id, emailData });
    } else {
      mutation.mutate(emailData);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex flex-col flex-grow">
        <Input
          label="Subject"
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <Textarea
          label="Body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={Math.ceil(window.innerHeight / 50)}
          className="overflow-scroll flex-grow"
        />
      </div>
      <div className="mt-6">
        {loading ? (
          <span>{email ? "Updating..." : "Creating..."}</span>
        ) : (
          <button className="link" onClick={handleSubmit}>
            {email ? "Update" : "Create"}
          </button>
        )}
      </div>
    </div>
  );
}
