import { useEffect, useState } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import api from "../api";

export default function SummaryGuard({ children }) {
  const { lessonId } = useParams();
  const location = useLocation();
  const [state, setState] = useState({ loading: true, allowed: false, to: null });

  useEffect(() => {
    const run = async () => {
      try {
        const res = await api.get(`/api/lesson/${lessonId}/summary/allowed/`);
        setState({
          loading: false,
          allowed: !!res.data?.allowed,
          to : res.data?.redirect_to || "/home/student"
        });
      } catch {
        setState({ loading: false, allowed: false, to: "/home/instructor" });
      }
    };
    run();
  }, [lessonId]);

  if (state.loading) return <div className="p-6">Provjeravam pristup…</div>;
  if (!state.allowed) return <Navigate to={state.to} replace state={{ from: location.pathname }} />;
  return children;
}
