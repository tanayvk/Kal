import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useEffect } from "react";
import { ArrowLeftCircleIcon } from "@heroicons/react/16/solid";

import { setPageTitle } from "@/stores/page";
import CircularProgress from "@/components/CircularProgress";
import Error from "@/components/Error";
import { Link } from "react-router-dom";

const Page = ({ title, children, back }) => {
  useEffect(() => {
    setPageTitle(title);
  }, []);

  return (
    <div className="flex-grow flex flex-col relative">
      {
        <Link
          to={back?.url || "/dashboard"}
          className="absolute p-2 flex items-center cursor-pointer link"
        >
          <ArrowLeftCircleIcon className="size-6" />
        </Link>
      }
      <div className="flex-grow flex justify-center pt-10">
        <div className="space-y-10 container px-4 md:px-0 lg:max-w-[1280px]">
          {title && <h1 className="font-semibold text-2xl">{title}</h1>}
          <div className="h-full overflow-scroll">
            <Suspense fallback={<CircularProgress height="h-64" />}>
              <ErrorBoundary
                fallback={<Error height="h-64" text="Something went wrong." />}
              >
                {children}
              </ErrorBoundary>
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
