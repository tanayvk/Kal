import Page from "@/components/Page";
import EditList from "@/components/EditList";

const CreateList = () => {
  return (
    <Page title="Create List" back={{ url: "/lists" }}>
      <EditList />
    </Page>
  );
};

export default CreateList;
