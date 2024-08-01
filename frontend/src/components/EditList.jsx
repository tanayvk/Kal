import { createList, updateList } from "../api";
import { useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import { useNavigate } from "react-router-dom";

import Input from "@/components/Input";
import Button from "@/components/Button";

export default function EditEmail({ list }) {
  const [title, setTitle] = useState(list?.title || "");
  const [description, setDescription] = useState(list?.description || "");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const queryClient = useQueryClient();
  const mutation = useMutation(list ? updateList : createList, {
    onSuccess: () => {
      queryClient.invalidateQueries("lists");
      navigate("/lists");
    },
    onSettled: () => {
      setLoading(false);
    },
  });

  const handleSubmit = () => {
    const listData = {
      title,
      description,
    };
    setLoading(true);
    if (list) {
      mutation.mutate({ id: list.id, listData });
    } else {
      mutation.mutate(listData);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex flex-col flex-grow">
        <Input
          label="Title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="title of your list"
        />
        <Input
          label="Description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="describe your list"
        />
      </div>
      <div className="mt-6 space-x-3">
        <Button onClick={handleSubmit} loading={loading}>
          {list ? "Update" : "Create"}
        </Button>
      </div>
    </div>
  );
}
