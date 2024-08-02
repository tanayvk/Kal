import { Field, Label, Description } from "@headlessui/react";
import Checkbox from "./Checkbox";

function Selector({ selected, setSelected, lists, compact }) {
  if (!lists?.length) return <span className="text-sm">{"No lists."}</span>;
  return (
    <div className={`mt-2 flex ${compact ? "" : "flex-col items-start"} gap-3`}>
      {lists.map((list) => (
        <div className="flex items-center justify-center">
          <Checkbox
            enabled={selected.includes(list.id)}
            setEnabled={(v) => setSelected(list.id, v)}
          />
          <div className={`flex flex-col ${compact ? "pl-2" : "pl-3"}`}>
            <span className="text-sm text">{list.title}</span>
            {!compact && (
              <span className="text-sm text-white/50">{list.description}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ListSelector({
  selected,
  setSelected,
  label,
  description,
  lists,
  className = "",
  compact = true,
}) {
  return (
    <div className={`flex w-full ${className}`}>
      <Field>
        <Label className="text-sm/6 font-medium text-white">{label}</Label>
        <Description className="text-sm/6 text-white/50">
          {description}
        </Description>
        <Selector
          selected={selected}
          setSelected={setSelected}
          lists={lists}
          compact={compact}
        />
      </Field>
    </div>
  );
}

export default ListSelector;
