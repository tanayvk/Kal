import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Field,
  Label,
  Description,
} from "@headlessui/react";
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";

export default function MyListbox({
  label,
  description,
  options,
  selected,
  onChange,
  displayFn = (x) => x,
  keyFn = (x) => x.key || x,
  valueFn = (x) => x.value || x,
  emptyText = "No options",
  defaultText = "Select",
}) {
  return (
    <div className="w-full">
      <Field>
        <Label className="text-sm/6 font-medium text-white">{label}</Label>
        <Description className="text-sm/6 text-white/50">
          {description}
        </Description>
        <Listbox value={selected} onChange={onChange}>
          <ListboxButton
            className={clsx(
              "mt-2 relative block w-full rounded-lg bg-white/5 py-1.5 pr-8 pl-3 text-left text-sm/6 text-white",
              "focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-white/25",
            )}
          >
            {options.length === 0
              ? emptyText
              : selected
              ? displayFn(selected)
              : defaultText}
            <ChevronDownIcon
              className="group pointer-events-none absolute top-2.5 right-2.5 size-4 fill-white/60"
              aria-hidden="true"
            />
          </ListboxButton>
          <ListboxOptions
            anchor="bottom"
            transition
            className={clsx(
              "w-[var(--button-width)] rounded-xl border border-white/5 bg-neutral-800 p-1 [--anchor-gap:var(--spacing-1)] focus:outline-none",
              "transition duration-100 ease-in data-[leave]:data-[closed]:opacity-0 empty:invisible",
            )}
          >
            {options.map((option) => (
              <ListboxOption
                key={keyFn(option)}
                value={valueFn(option)}
                className="cursor-pointer group flex items-center gap-2 rounded-lg py-1.5 px-3 select-none data-[focus]:bg-white/10"
              >
                <div className="text-sm/6 text-white">{displayFn(option)}</div>
              </ListboxOption>
            ))}
          </ListboxOptions>
        </Listbox>
      </Field>
    </div>
  );
}
