import { useParams } from "react-router-dom";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "react-query";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import moment from "moment";
import { parseDate } from "chrono-node";

import Input from "@/components/Input";
import Listbox from "@/components/Listbox";
import { useSenders, sendEmail } from "@/api";
import Page from "@/components/Page";

function Send() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [filter, setFilter] = useState("");
  const [time, setTime] = useState("");
  const [timestamp, setTimestamp] = useState("");
  console.log("time", timestamp);
  const [sender, setSender] = useState(null);
  const [loading, setLoading] = useState(false);
  const { data: sendersData } = useSenders();
  const senders = sendersData?.data || [];
  const queryClient = useQueryClient();

  useEffect(() => {
    if (time) {
      const ref = new Date();
      setTimestamp(parseDate(time, ref, { forwardDate: true }));
    } else {
      setTimestamp(new Date());
    }
  }, [time]);
  const mutation = useMutation(sendEmail, {
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries("senders");
      setLoading(false);
      navigate("/emails");
    },
    onError: () => {
      setLoading(false);
    },
  });
  const handleSubmit = () => {
    const emailData = {
      id,
      senderId: sender.id,
      filter,
      time,
    };
    mutation.mutate(emailData);
  };
  return (
    <div>
      <div className="space-y-3">
        <Listbox
          label={
            <div className="flex space-x-2">
              <span>Sender</span>
              <span className="font-light link">
                <Link to="/create-sender">Create New</Link>
              </span>
            </div>
          }
          description="Choose a sender to use as the From address for this email."
          options={senders}
          displayFn={(sender) => sender.from}
          keyFn={(sender) => sender.id}
          valueFn={(sender) => sender}
          onChange={setSender}
          selected={sender}
          emptyText="No senders."
          defaultText="Select Sender"
        />
        <Input
          label="Filter"
          description="Set a filter to send an email to subscribers that match a condition."
          value={filter}
          placeholder="age > 32"
          onChange={(e) => setFilter(e.target.value)}
        />
        <Input
          label="Time"
          description="Schedule the email to be sent at a later time."
          value={time}
          onChange={(e) => setTime(e.target.value)}
          placeholder="tomorrow at 5:30 PM"
          preview={
            timestamp
              ? `Email will be sent at ${moment(timestamp).format(
                  "MMMM Do YYYY, h:mm A Z",
                )}.`
              : "Invalid time."
          }
        />
      </div>
      <div className="mt-6 space-x-2">
        {loading ? (
          <span>Sending...</span>
        ) : (
          <button
            className="link text-green-400 hover:text-green-300"
            onClick={handleSubmit}
          >
            Send
          </button>
        )}
        <button className="link text-violet-400 hover:text-violet-300">
          Preview
        </button>
      </div>
    </div>
  );
}

const SendEmail = () => {
  return (
    <Page title="Send Email">
      <Send />
    </Page>
  );
};

export default SendEmail;
