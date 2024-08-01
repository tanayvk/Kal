import { useLocation } from "react-router-dom";

export const useIsTemplate = () => {
  const location = useLocation();
  const routeName = location.pathname.split("/")[1];
  return routeName.includes("template");
};
