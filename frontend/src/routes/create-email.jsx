import moment from "moment";

import Page from "@/components/Page";
import CircularProgress from "@/components/CircularProgress";
import * as api from "@/api";
import { useState } from "react";
import { createEmail } from "../api";
import { useIsTemplate } from "../utils/templates";
import { useNavigate } from "react-router-dom";

const CreateEmail = () => {
  const navigate = useNavigate();
  const isTemplate = useIsTemplate();
  const { data } = api.useTemplates();
  const [loading, setLoading] = useState(false);
  const templates = [
    {
      id: "blank",
      subject: "Blank",
    },
    ...(data?.data || []),
  ];
  const handleChoose = async (id) => {
    setLoading(true);
    const data = await createEmail({
      isTemplate,
      ...(id === "blank" ? {} : { template: id }),
    });
    console.log("data", data);
    setLoading(false);
    navigate(`${isTemplate ? "/templates/" : "/emails/"}${data.data}`);
  };
  return (
    <Page
      title={`Create ${isTemplate ? "Template" : "Email"}: Choose a Template`}
    >
      {loading && <CircularProgress height="h-64" />}
      {!loading &&
        templates.map((email) => (
          <div
            className="p-2 cursor-pointer hover:bg-white/5"
            key={email.id}
            onClick={() => handleChoose(email.id)}
          >
            <div className="flex items-center">
              <div className="flex flex-col">
                {email.subject}
                {(email.updatedAt && (
                  <span className="text-md text-neutral-300/60">
                    Updated {moment.utc(email.updatedAt).fromNow()}
                  </span>
                )) || (
                  <span className="text-md text-neutral-300/60">
                    Start with a blank template.
                  </span>
                )}
              </div>
              <div className="flex-grow"></div>
              <div className="space-x-2"></div>
            </div>
          </div>
        ))}
    </Page>
  );
};

export default CreateEmail;
