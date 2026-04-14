import { Navigate, useLocation } from "react-router";
import { AppRoute } from "~app/routes";

export function AuthNavigate() {
  const location = useLocation();

  return <Navigate to={AppRoute.로그인} state={{ from: location }} replace />
}

export function useAuthRedirection() {
  const location = useLocation();

  if (typeof location.state.from !== 'string') {
    return null;
  }

  return location.state.from;
}