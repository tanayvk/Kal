import { createEmail, updateEmail } from "../api";
import { useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import { useNavigate } from "react-router-dom";

import Input from "@/components/Input";
import Textarea from "@/components/Textarea";
import Button from "@/components/Button";

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
          placeholder="subject line here"
        />
        <Textarea
          label="Body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={Math.ceil(window.innerHeight / 90)}
          className="overflow-scroll flex-grow"
          placeholder="write your email body in markdown"
        />
      </div>
      <div className="mt-6 space-x-3">
        <Button onClick={handleSubmit} loading={loading}>
          {email ? "Update" : "Create"}
        </Button>
        <span className="link text-sm">Preview</span>
      </div>
    </div>
  );
}
