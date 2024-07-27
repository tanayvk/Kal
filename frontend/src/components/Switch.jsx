import { Field, Label, Description, Switch } from "@headlessui/react";

export default function MySwitch({ enabled, setEnabled, label, description }) {
  return (
    <div className="w-full">
      <Field>
        <Label className="text-sm/6 font-medium text-white">{label}</Label>
        <Description className="text-sm/6 text-white/50">
          {description}
        </Description>
        <Switch
          checked={enabled}
          onChange={setEnabled}
          className="mt-2 group relative flex h-7 w-14 cursor-pointer rounded-full bg-white/10 p-1 transition-colors duration-200 ease-in-out focus:outline-none data-[focus]:outline-1 data-[focus]:outline-white data-[checked]:bg-white/10"
        >
          <span
            aria-hidden="true"
            className="pointer-events-none inline-block size-5 translate-x-0 rounded-full bg-white ring-0 shadow-lg transition duration-200 ease-in-out group-data-[checked]:translate-x-7"
          />
        </Switch>
      </Field>
    </div>
  );
}
