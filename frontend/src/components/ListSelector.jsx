import { Field, Label, Description } from "@headlessui/react";

import { useLists } from "@/api";
import Checkbox from "./Checkbox";

function Selector({ selected, setSelected }) {
  const { data } = useLists();
  if (!data?.data.length) return <span className="text-sm">{"No lists."}</span>;
  const lists = data.data;
  return (
    <div className="mt-2 flex gap-3">
      {lists.map((list) => (
        <div className="flex items-center justify-center">
          <Checkbox
            enabled={selected.includes(list.id)}
            setEnabled={(v) => setSelected(list.id, v)}
          />
          <span className="pl-2 text-sm">{list.title}</span>
        </div>
      ))}
    </div>
  );
}

function ListSelector({ selected, setSelected, label, description }) {
  return (
    <div className="w-full">
      <Field>
        <Label className="text-sm/6 font-medium text-white">{label}</Label>
        <Description className="text-sm/6 text-white/50">
          {description}
        </Description>
        <Selector selected={selected} setSelected={setSelected} />
      </Field>
    </div>
  );
}

export default ListSelector;
