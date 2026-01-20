import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api";
import { ACCESS_TOKEN } from "../constants";

export default function FlowEnforcer() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem(ACCESS_TOKEN);

  useEffect(() => {
    if (!token) return;

    let alive = true;

    (async () => {
      try {
        const res = await api.get("/api/flow/next/");
        if (!alive) return;

        const target = res.data?.redirect_to;
        if (!target) return;

        // već si tamo -> ništa
        if (location.pathname === target) return;

        navigate(target, { replace: true });
      } catch {
        // ignore
      }
    })();

    return () => {
      alive = false;
    };
  }, [token, location.pathname, navigate]);

  return null;
}
