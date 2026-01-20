import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { ACCESS_TOKEN } from "../constants";
import LoadingPage from "./LoadingPage";

const norm = (v) => (v ? String(v).toLowerCase() : "");

export default function HomeRedirect() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    const go = async () => {
      const token = localStorage.getItem(ACCESS_TOKEN);
      if (!token) {
        if (alive) navigate("/login", { replace: true });
        return;
      }

      try {
        const res = await api.get("/api/user/role/");
        const role = norm(res.data?.role);

        if (!role) {
          navigate("/role", { replace: true });
        } else {
          navigate(`/home/${role}`, { replace: true }); // admin -> /home/admin
        }
      } catch {
        navigate("/login", { replace: true });
      } finally {
        if (alive) setLoading(false);
      }
    };

    go();
    return () => {
      alive = false;
    };
  }, [navigate]);

  return loading ? <LoadingPage /> : null;
}
