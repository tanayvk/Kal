import { useState } from "react";
import { useMutation } from "react-query";

import * as api from "@/api";
import Input from "@/components/Input";

export default function Subscribe() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const mutation = useMutation(api.subscribe, {
    onSettled: () => {
      setLoading(false);
    },
  });

  const handleSubmit = () => {
    setLoading(true);
    mutation.mutate({ name, email });
  };
  return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="w-1/3 rounded-md border-2 border-white/20 p-4">
        <span className="text-2xl">Subscription Form</span>
        <div className="h-4"></div>
        <div className="space-y-3">
          <Input
            label="Name"
            description="ex: John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Email"
            description="ex: johndoe@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="mt-6">
          {loading ? (
            "Subscribing"
          ) : (
            <a onClick={handleSubmit} className="link">
              Subscribe
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
