import { useEffect, useState } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import api from "../api";
import LoadingPage from "../pages/LoadingPage";

export default function ReviewGuard({ children }) {
  const { lessonId } = useParams();
  const location = useLocation();
  const [state, setState] = useState({ loading: true, allowed: false, to: null });

  useEffect(() => {
    const run = async () => {
      try {
        const res = await api.get(`/api/reviews/${lessonId}/allowed/`);
        const allowed = !!res.data?.allowed;
        const to = res.data?.redirect_to || "/home/student";
        setState({ loading: false, allowed, to });
      } catch (e) {
        setState({ loading: false, allowed: false, to: "/home/student" });
      }
    };
    run();
  }, [lessonId]);

  if (state.loading) {
    return (
      <div className="min-h-[50vh] grid place-items-center text-[#3674B5]">
        <LoadingPage/>
      </div>
    );
  }

  if (!state.allowed) {
    return <Navigate to={state.to} replace state={{ from: location.pathname }} />;
  }

  return children;
}
