import { Description, Field, Label, Textarea } from "@headlessui/react";
import clsx from "clsx";

export default function TextareaField({
  label,
  description,
  className,
  ...rest
}) {
  return (
    <div className="w-full">
      <Field>
        <Label className="text-sm/6 font-medium text-white">{label}</Label>
        <Description className="text-sm/6 text-white/50">
          {description}
        </Description>
        <Textarea
          className={clsx(
            "mt-3 block w-full resize-none rounded-lg border-none dark:bg-white/5 py-1.5 px-3 text-sm/6 dark:text-white",
            "focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 dark:data-[focus]:outline-white/25",
            className || "",
          )}
          {...rest}
        />
      </Field>
    </div>
  );
}
