import Page from "@/components/Page";
import EditSender from "@/components/EditSender";

const CreateSender = () => {
  return (
    <Page title="Create Sender" back={{ url: "/senders" }}>
      <EditSender />
    </Page>
  );
};

export default CreateSender;
