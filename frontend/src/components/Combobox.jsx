import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Field,
  Label,
  Description,
} from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import { useState } from "react";

export default function Example({
  label,
  description,
  displayFn = (x) => x,
  keyFn = (x) => x.id || x,
  options,
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);

  const filteredOptions =
    query === ""
      ? options
      : options.filter((option) => {
          return displayFn(option).toLowerCase().includes(query.toLowerCase());
        });

  return (
    <div className="w-full">
      <Field>
        <Label className="text-sm/6 font-medium text-white">{label}</Label>
        <Description className="text-sm/6 text-white/50">
          {description}
        </Description>
        <Combobox
          value={selected}
          onChange={(value) => setSelected(value)}
          onClose={() => setQuery("")}
        >
          <div className="relative">
            <ComboboxInput
              className={clsx(
                "w-full rounded-lg border-none bg-white/5 py-1.5 pr-8 pl-3 text-sm/6 text-white",
                "focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-white/25",
              )}
              displayValue={displayFn}
              onChange={(event) => setQuery(event.target.value)}
            />
            <ComboboxButton className="group absolute inset-y-0 right-0 px-2.5">
              <ChevronDownIcon className="size-4 fill-white/60 group-data-[hover]:fill-white" />
            </ComboboxButton>
          </div>
          <ComboboxOptions
            anchor="bottom"
            transition
            className={clsx(
              "w-[var(--input-width)] rounded-xl border border-white/5 bg-white/5 p-1 [--anchor-gap:var(--spacing-1)] empty:invisible",
              "transition duration-100 ease-in",
            )}
          >
            {filteredOptions.map((option) => (
              <ComboboxOption
                key={keyFn(option)}
                value={option}
                className="group flex cursor-pointer items-center gap-2 rounded-lg py-1.5 px-3 select-none data-[focus]:bg-white/10"
              >
                <div className="text-sm/6 text-white">{displayFn(option)}</div>
              </ComboboxOption>
            ))}
          </ComboboxOptions>
        </Combobox>
      </Field>
    </div>
  );
}
