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
      <div className="flex-grow flex justify-center pt-4">
        <div className="space-y-6 container px-4 md:px-0 lg:max-w-[1280px]">
          <div className="flex items-center gap-2">
            <Link
              to={back?.url || "/dashboard"}
              className="py-2 flex items-center cursor-pointer link"
            >
              <ArrowLeftCircleIcon className="size-6" />
            </Link>
            {title && <h1 className="font-semibold text-2xl">{title}</h1>}
          </div>
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
