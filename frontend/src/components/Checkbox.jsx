import { Checkbox } from "@headlessui/react";
import { CheckIcon } from "@heroicons/react/16/solid";

export default function CheckboxComponent({ enabled, setEnabled }) {
  return (
    <Checkbox
      checked={enabled}
      onChange={setEnabled}
      className="group size-5 rounded-md bg-white/10 p-1 ring-1 ring-white/15 ring-inset data-[checked]:bg-white"
    >
      <CheckIcon className="hidden size-3 fill-black group-data-[checked]:block" />
    </Checkbox>
  );
}
