import { useParams } from "react-router-dom";

import Page from "@/components/Page";
import EditSender from "@/components/EditSender";
import { useSender } from "@/api";

function Sender() {
  const { id } = useParams();
  const { data } = useSender(id);
  return <EditSender sender={data?.data} />;
}

const CreateSender = () => {
  return (
    <Page title="Create Sender" back={{ title: "Senders", url: "/senders" }}>
      <Sender />
    </Page>
  );
};

export default CreateSender;
