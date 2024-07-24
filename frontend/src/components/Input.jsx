import { Field, Label, Description, Input } from "@headlessui/react";
import clsx from "clsx";

const InputField = ({ label, description, preview, ...rest }) => (
  <div className="w-full">
    <Field>
      <Label className="text-sm/6 font-medium text-white">{label}</Label>
      <Description className="text-sm/6 text-white/50">
        {description}
      </Description>
      <Input
        className={clsx(
          "mt-3 block w-full rounded-lg bg-white/5 py-1.5 px-3 text-sm/6 text-white",
          "focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-white/25",
          "placeholder:opacity-60",
        )}
        {...rest}
      />
      {preview !== undefined && (
        <>
          <div className="h-1"></div>
          <span className="text-sm mt-4 text-gray-300/60">{preview}</span>
        </>
      )}
    </Field>
  </div>
);

export default InputField;
