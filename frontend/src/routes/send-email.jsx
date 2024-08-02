import { useParams } from "react-router-dom";
import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "react-query";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import moment from "moment";
import { parseDate } from "chrono-node";

import Input from "@/components/Input";
import Listbox from "@/components/Listbox";
import Button from "@/components/Button";
import { useSenders, sendEmail, useLists } from "@/api";
import Page from "@/components/Page";
import { setSentEmails } from "@/stores/sent-email";
import ListSelector from "../components/ListSelector";
import { debounce } from "../utils/debounce";
import { getSubs } from "../api";

function Send() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [filter, setFilter] = useState("");
  const [time, setTime] = useState("");
  const [timestamp, setTimestamp] = useState("");
  const [sender, setSender] = useState(null);
  const [loading, setLoading] = useState(false);
  const { data: sendersData } = useSenders();
  const senders = sendersData?.data || [];
  const queryClient = useQueryClient();
  const [selectedLists, setLists] = useState([]);
  const [subs, setSubs] = useState(0);
  const [subsLoading, setSubsLoading] = useState(true);
  const { data: listsData } = useLists();
  const lists = listsData?.data || [];

  const sendingTime = (
    timestamp ? moment(timestamp) : moment(new Date())
  ).format("MMMM Do YYYY, h:mm A Z");

  const computeSubs = useCallback(
    debounce(async () => {
      setSubsLoading(true);
      try {
        const count = await getSubs({ lists: selectedLists, filter });
        setSubs(count.data);
      } catch (err) {
        console.error("err fetching subs", err);
      }
      setSubsLoading(false);
    }, 1000),
    [],
  );

  useEffect(() => {
    if (time) {
      const ref = new Date();
      setTimestamp(parseDate(time, ref, { forwardDate: true }));
    } else {
      setTimestamp(new Date());
    }
  }, [time]);

  useEffect(() => {
    computeSubs();
  }, [filter, selectedLists]);

  const mutation = useMutation(sendEmail, {
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries("senders");
      setLoading(false);
      navigate("/emails");
      setSentEmails(subs);
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
      lists: selectedLists,
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
          label={
            <div>
              <span>Filter</span>
            </div>
          }
          description="Set a filter to send an email to subscribers that match a condition."
          value={filter}
          placeholder="age > 32"
          onChange={(e) => setFilter(e.target.value)}
        />
        <ListSelector
          label="Lists"
          description="Choose the lists that you want to send this email to."
          selected={selectedLists}
          setSelected={(list, v) => {
            if (v) setLists([...selectedLists, list]);
            else setLists(selectedLists.filter((l) => list !== l));
          }}
          lists={lists}
        />
        <Input
          label="Time"
          description="Schedule the email to be sent at a later time."
          value={time}
          onChange={(e) => setTime(e.target.value)}
          placeholder="tomorrow at 5:30 PM"
          preview={!timestamp && "Invalid time."}
        />
      </div>
      <div className="flex mt-6 items-center">
        <Button onClick={handleSubmit} loading={loading}>
          Send
        </Button>
        <span className="text-sm text-white/60 pl-2">
          {subsLoading
            ? "Loading..."
            : `Email will be sent to ${subs} subscriber${
                subs === 1 ? "" : "s"
              } at ${sendingTime}.`}
        </span>
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
