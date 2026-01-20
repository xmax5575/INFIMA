import { useEffect, useState } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import api from "../api";
import LoadingPage from "../pages/LoadingPage";

export default function PaymentGuard({ children }) {
  const { lessonId } = useParams();
  const location = useLocation();
  const [state, setState] = useState({ loading: true, allowed: false, to: null });

  useEffect(() => {
    const run = async () => {
      try {
        const res = await api.get(`/api/payments/${lessonId}/allowed/`);
        const allowed = !!res.data?.allowed;
        const to = "/home/student";
        setState({ loading: false, allowed, to });
      } catch {
        setState({ loading: false, allowed: false, to: "/home/student" });
      }
    };
    run();
  }, [lessonId]);

  if (state.loading) return <div className="p-6"><LoadingPage/></div>;
  if (!state.allowed) return <Navigate to={state.to} replace state={{ from: location.pathname }} />;

  return children;
}
