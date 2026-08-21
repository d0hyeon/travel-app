import { Navigate, useLocation, useNavigate } from "react-router";
import { AppRoute } from "~app/routes";

export function AuthNavigate() {
  return <Navigate to={AppRoute.로그인} state={{ from: window.location.href }} replace />
}

export function useAuthNavigate() {
  const navigate = useNavigate();

  return () => {
    return navigate(AppRoute.로그인, { state: { from: window.location.href } });
  }
}

export function useAuthRedirection() {
  const location = useLocation();

  if (typeof location.state?.from !== 'string') {
    return null;
  }

  return location.state.from;
}
