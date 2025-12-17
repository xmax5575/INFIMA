import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import api from "../api";
import { ACCESS_TOKEN, PROFILE_COMPLETED } from "../constants";

const norm = (v) => (v ? String(v).toLowerCase() : "");

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const location = useLocation();
  const token = localStorage.getItem(ACCESS_TOKEN);

  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null); // null = još nije učitano, "" = nema role, "instructor"/"student"

  const allowed = useMemo(() => allowedRoles.map(norm), [allowedRoles]);

  useEffect(() => {
    let alive = true;

    const loadRole = async () => {
      if (!token) {
        if (alive) {
          setRole(null);
          setLoading(false);
        }
        return;
      }

      try {
        const res = await api.get("/api/user/role/");
        if (!alive) return;
        const r = norm(res.data?.role);
        setRole(r || ""); // "" znači: nema role postavljenu
      } catch {
        if (!alive) return;
        setRole(""); // tretiraj kao nema role
      } finally {
        if (alive) setLoading(false);
      }
    };

    setLoading(true);
    setRole(null);
    loadRole();

    return () => {
      alive = false;
    };
  }, [token]);

  // 1) nije prijavljen
  if (!token) return <Navigate to="/login" replace state={{ from: location }} />;
  if (loading || role === null) return null; // čekaj da role bude učitana

  const profileCompleted = localStorage.getItem(PROFILE_COMPLETED) === "true";

  const pathname = location.pathname;

  const isRolePage = pathname === "/role";
  const isHomePage = pathname.startsWith("/home/");
  const isAnyEditPage = pathname.startsWith("/profiles/") && pathname.endsWith("/edit");

  // 2) nema role -> smije samo na /role
  if (role === "") {
    if (isRolePage) return children;
    return <Navigate to="/role" replace />;
  }

  // ako ima role, ovo su "prave" rute
  const editPath = `/profiles/${role}/edit`;
  const homePath = `/home/${role}`;

  const isMyEditPage = pathname === editPath; // točno moja edit ruta

  // 3) ako je na /role i već ima role -> edit prije home
  if (isRolePage) {
    return <Navigate to={profileCompleted ? homePath : editPath} replace />;
  }

  // 4) HARD BLOK: dok profil nije dovršen -> zabranjen je home i sve ostalo osim moje edit rute
  if (!profileCompleted) {
    // pusti samo moju edit rutu
    if (isMyEditPage) return children;

    // sve drugo (uključujući /home/* i druge profile editove) -> na moju edit
    return <Navigate to={editPath} replace />;
  }

  // 5) kad je profil dovršen, role-based zaštita
  if (allowed.length > 0 && !allowed.includes(role)) {
    return <Navigate to={homePath} replace />;
  }

  return children;
}
