import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "react-query";

import * as api from "@/api";
import Page from "@/components/Page";

function SubList() {
  const queryClient = useQueryClient();
  const { data } = api.useSubscribers();

  if (!data?.data.length)
    return (
      <div className="h-[50vh] flex items-center justify-center gap-2">
        {"No subscribers."}
      </div>
    );

  const subs = data.data;
  return (
    <div className="w-full mx-auto space-y-2">
      {subs.map((sub) => (
        <div className="flex" key={sub.id}>
          <Link className="hover:underline" to={`/subscriber/${sub.id}`}>
            {sub.email}
          </Link>
          <div className="ml-8 space-x-2">
            <a
              onClick={() => handleDelete(sub.id)}
              className="link text-red-500 hover:text-red-400"
            >
              Delete
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

const ManageSubscribers = () => {
  return (
    <Page title="Subscribers">
      <SubList />
    </Page>
  );
};

export default ManageSubscribers;
