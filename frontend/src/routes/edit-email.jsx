import { useParams } from "react-router-dom";

import Page from "@/components/Page";
import EditEmail from "@/components/EditEmail";
import { useEmail } from "@/api";
import { useNavigate } from "react-router-dom";
import { useIsTemplate } from "../utils/templates";

function Email({ id }) {
  const { data } = useEmail(id);
  return <EditEmail email={data?.data} />;
}

const Edit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  return (
    <Page
      actions={[
        <a
          onClick={() => navigate(`/emails/${id}/send`)}
          className="link text-green-400 hover:text-green-300"
        >
          Send
        </a>,
      ]}
    >
      <Email id={id} />
    </Page>
  );
};

export default Edit;
