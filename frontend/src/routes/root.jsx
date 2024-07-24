import { Link } from "react-router-dom";
import { Outlet } from "react-router-dom";
import { usePageTitle } from "../page";

export default function Root() {
  const pageTitle = usePageTitle();
  return (
    <div className="text-xl w-full h-full flex flex-col">
      <div className="p-3 flex border-b border-neutral-700">
        <div className="flex space-x-4">
          <span className="font-bold">
            <Link to="/dashboard">Kal</Link>
          </span>
          {pageTitle && <span>{`${pageTitle}`}</span>}
        </div>
        <div className="flex-grow"></div>
        <Link className="link" to="/logout">
          Logout
        </Link>
      </div>
      <Outlet />
    </div>
  );
}
