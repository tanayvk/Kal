import moment from "moment";

import Page from "@/components/Page";
import CircularProgress from "@/components/CircularProgress";
import * as api from "@/api";
import { useState } from "react";
import { createEmail } from "../api";
import { useIsTemplate } from "../utils/templates";
import { useNavigate } from "react-router-dom";

const Choose = ({ isTemplate }) => {
  const navigate = useNavigate();
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
    setLoading(false);
    navigate(`${isTemplate ? "/templates/" : "/emails/"}${data.data}`);
  };
  return (
    <>
      {loading && <CircularProgress height="h-64" />}
      {!loading && (
        <div className="space-y-2">
          {templates.map((email) => (
            <div
              className="p-2 border border-white/20 cursor-pointer hover:bg-white/5"
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
        </div>
      )}
    </>
  );
};

const CreateEmail = () => {
  const isTemplate = useIsTemplate();
  return (
    <Page
      title={`Choose a template`}
      back={{ url: isTemplate ? "/templates" : "/emails" }}
    >
      <Choose isTemplate={isTemplate} />
    </Page>
  );
};

export default CreateEmail;
