import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "react-query";

import * as api from "@/api";
import Page from "@/components/Page";

function Lists() {
  const queryClient = useQueryClient();
  const { data } = api.useLists();
  const deleteMutation = useMutation(api.deleteList, {
    onMutate: async (id) => {
      await queryClient.cancelQueries("lists");
      const previousData = queryClient.getQueryData("lists");

      queryClient.setQueryData("lists", (oldData) => ({
        ...oldData,
        data: oldData.data.filter((list) => list.id !== id),
      }));

      return { previousData };
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData("lists", context.previousData);
    },
    onSettled: () => {
      queryClient.invalidateQueries("lists");
    },
  });
  const handleDelete = (id) => {
    deleteMutation.mutate(id);
  };
  if (!data?.data.length)
    return (
      <div className="h-[50vh] flex items-center justify-center gap-2">
        {"No lists."}
        <Link className="link font-bold" to="/create-list">
          Create.
        </Link>
      </div>
    );
  const lists = data.data;
  return (
    <div className="w-full mx-auto space-y-2">
      {lists.map((list) => (
        <div className="py-2">
          <div className="flex items-center" key={list.id}>
            <div className="flex flex-col">
              <Link
                className="text-2xl font-semibold hover:underline"
                to={`/lists/${list.id}`}
              >
                {list.title}
              </Link>
              <span className="text-md text-neutral-300/60">
                {list.description}
              </span>
            </div>
            <div className="flex-grow"></div>
            <div className="space-x-2">
              <a
                onClick={() => handleDelete(list.id)}
                className="link text-red-500 hover:text-red-400"
              >
                Delete
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const ManageLists = () => {
  return (
    <Page
      title="Lists"
      actions={[
        <Link to="/create-list" className="link">
          Create
        </Link>,
      ]}
    >
      <Lists />
    </Page>
  );
};

export default ManageLists;
