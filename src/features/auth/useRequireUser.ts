import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUser } from "./useUser";

export function useRequireUser(): string {
  const { userId } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (userId === null) {
      const returnTo = location.pathname + location.search;
      navigate(`/login?returnTo=${encodeURIComponent(returnTo)}`, { replace: true });
    }
  }, [userId, navigate, location.pathname, location.search]);

  return userId ?? "";
}
