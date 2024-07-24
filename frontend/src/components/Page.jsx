import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useEffect } from "react";

import { setPageTitle } from "@/page";
import CircularProgress from "@/components/CircularProgress";
import Error from "@/components/Error";

const Page = ({ title, children }) => {
  useEffect(() => {
    setPageTitle(title);
  }, []);

  return (
    <div className="flex-grow flex flex-col">
      <div className="flex-grow flex items-center justify-center">
        <div className="space-y-10 container px-4 md:px-0">
          <Suspense fallback={<CircularProgress height="h-64" />}>
            <ErrorBoundary fallback={<Error text="Something went wrong." />}>
              {children}
            </ErrorBoundary>
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default Page;
