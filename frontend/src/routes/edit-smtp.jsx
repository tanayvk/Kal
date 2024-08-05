import { useParams } from "react-router-dom";

import Page from "@/components/Page";
import EditSMTP from "@/components/EditSMTP";
import { useSmtpServer } from "@/api";

function SMTP() {
  const { id } = useParams();
  const { data } = useSmtpServer(id);
  return <EditSMTP smtpServer={data?.data} />;
}

const Edit = () => {
  return (
    <Page title="Edit SMTP Server" back={{ title: "SMTP", url: "/smtp" }}>
      <SMTP />
    </Page>
  );
};

export default Edit;
