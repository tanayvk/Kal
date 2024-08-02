import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useState } from "react";
import { useMutation } from "react-query";
import { useLocation } from "react-router-dom";

import * as api from "@/api";
import Button from "@/components/Button";
import Input from "@/components/Input";
import ListSelector from "@/components/ListSelector";
import CircularProgress from "@/components/CircularProgress";
import Error from "@/components/Error";
import { useSubInfo } from "../api";
import { useParams } from "react-router-dom";

function Subscribe({ update = false, id, uuid }) {
  const { data } = useSubInfo({ id, uuid });
  const lists = data?.data?.lists || [];
  const [name, setName] = useState(data?.data?.name || "");
  const [email, setEmail] = useState(data?.data?.email || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [selectedLists, setLists] = useState(data?.data?.selectedLists || []);

  const mutation = useMutation(update ? api.updateSubscriber : api.subscribe, {
    onSettled: () => {
      setLoading(false);
    },
    onSuccess: () => {
      setSubscribed(true);
      setError("");
    },
    onError: () => {
      setError("An error occurred. Please try again later.");
    },
  });

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const handleSubmit = () => {
    setError("");
    if (!name) {
      setError("Name is required.");
      return;
    }
    if (!validateEmail(email)) {
      setError("Invalid email address.");
      return;
    }
    setLoading(true);
    const payload = { name, email, lists: selectedLists, attributes: {} };
    if (update) {
      mutation.mutate({ ...payload, id, uuid });
    } else {
      mutation.mutate(payload);
    }
  };

  return (
    <>
      <span className="text-2xl">
        {update ? "Update Preferences" : "Subscribe"}
      </span>
      <div className="h-4"></div>
      <div className="space-y-3">
        <Input
          label="Name"
          description="ex: John Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          disabled={update ? true : false}
          label="Email"
          description="ex: johndoe@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <ListSelector
          label="Lists"
          description="What lists do you want to subscribe to?"
          selected={selectedLists}
          setSelected={(list, v) => {
            if (v) setLists([...selectedLists, list]);
            else setLists(selectedLists.filter((l) => list !== l));
          }}
          lists={lists}
          compact={false}
        />
      </div>
      <div className="mt-6">
        {subscribed ? (
          <>
            <div>
              <Button disabled>
                <span>{update ? "Updated!" : "Subscribed!"}</span>
              </Button>
            </div>
            <div className="mt-4">
              <span>
                {update
                  ? "Your preferences have been updated."
                  : "Please check your inbox to confirm your subscription."}
              </span>
            </div>
          </>
        ) : (
          <Button onClick={handleSubmit} loading={loading} className="link">
            {update ? "Update Preferences" : "Subscribe"}
          </Button>
        )}
      </div>
      {error && <div className="pt-4 text-red-500 text-lg">{error}</div>}
    </>
  );
}

export default function SubscribeWrapper() {
  const location = useLocation();
  const routeName = location.pathname.split("/").pop();
  const update = routeName === "update";
  const { id, uuid } = useParams();
  return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="w-1/3 rounded-md border-2 border-white/20 p-4">
        <Suspense fallback={<CircularProgress height="h-64" />}>
          <ErrorBoundary
            fallback={<Error height="h-64" text="Subscriber not found." />}
          >
            <Subscribe update={update} id={id} uuid={uuid} />
          </ErrorBoundary>
        </Suspense>
      </div>
    </div>
  );
}
