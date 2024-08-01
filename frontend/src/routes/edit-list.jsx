import { useParams } from "react-router-dom";

import Page from "@/components/Page";
import EditList from "@/components/EditList";
import { useList } from "@/api";

function List() {
  const { id } = useParams();
  const { data } = useList(id);
  return <EditList list={data?.data} />;
}

const CreateList = () => {
  return (
    <Page title="Edit List">
      <List />
    </Page>
  );
};

export default CreateList;
