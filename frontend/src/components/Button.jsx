import { Button } from "@headlessui/react";

import CircularProgress from "@/components/CircularProgress";
import clsx from "clsx";

export default function ButtonComponent({
  children,
  onClick,
  loading,
  disabled,
}) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || loading}
      className={clsx([
        "inline-flex items-center gap-2 rounded-md py-1.5 px-3 text-sm/6 font-semibold",
        "text-white focus:outline-none bg-white/10",
        "data-[hover]:bg-white/20 data-[open]:bg-white/15 data-[focus]:outline-1 data-[focus]:outline-white",
        "relative",
      ])}
    >
      <span className={`${loading ? "invisible" : "visible"}`}>{children}</span>
      <span
        className={`${
          loading ? "block" : "hidden"
        } absolute top-1/2 left-1/2 transform translate-x-[-50%] translate-y-[-50%]`}
      >
        <span
          className={`text-white inline-block h-4 w-4 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]`}
          role="status"
        >
          <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
            Loading...
          </span>
        </span>
      </span>
    </Button>
  );
}
