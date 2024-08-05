import Page from "@/components/Page";
import EditSMTP from "@/components/EditSMTP";

const CreateSMTP = () => {
  return (
    <Page title="Create SMTP Server" back={{ url: "/smtp" }}>
      <EditSMTP />
    </Page>
  );
};

export default CreateSMTP;
