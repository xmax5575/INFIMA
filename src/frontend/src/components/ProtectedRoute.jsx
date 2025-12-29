import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import api from "../api";
import { ACCESS_TOKEN } from "../constants";

const norm = (v) => (v ? String(v).toLowerCase() : "");

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const location = useLocation();
  const token = localStorage.getItem(ACCESS_TOKEN);

  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  const allowed = useMemo(() => allowedRoles.map(norm), [allowedRoles]);

  useEffect(() => {
    let alive = true;

    const loadUserData = async () => {
      if (!token) {
        if (!alive) return;
        setRole(null);
        setIsProfileComplete(false);
        setLoading(false);
        return;
      }

      try {
        // 1) rola
        const roleRes = await api.get("/api/user/role/");
        const r = norm(roleRes.data?.role);

        if (!alive) return;
        setRole(r || "");

        // 2) profil (samo za instruktora)
        // 2) profil (instruktor + student)
        if (r === "instructor") {
          try {
            const profileRes = await api.get("/api/instructor/inf/");
            const bio = profileRes.data?.bio;
            const hasBio = typeof bio === "string" && bio.trim() !== "";
            if (alive) setIsProfileComplete(hasBio);
          } catch (err) {
            const status = err?.response?.status;
            if (status === 404) {
              if (alive) setIsProfileComplete(false);
            } else {
              console.error(
                "Greška pri dohvaćanju instructor profila:",
                err?.response?.data || err
              );
              if (alive) setIsProfileComplete(false);
            }
          }
        } else if (r === "student") {
          try {
            const profileRes = await api.get("/api/student/inf/");
            const goals = profileRes.data?.learning_goals;
            const hasGoals = typeof goals === "string" && goals.trim() !== "";
            if (alive) setIsProfileComplete(hasGoals);
          } catch (err) {
            const status = err?.response?.status;
            if (status === 404) {
              if (alive) setIsProfileComplete(false);
            } else {
              console.error(
                "Greška pri dohvaćanju student profila:",
                err?.response?.data || err
              );
              if (alive) setIsProfileComplete(false);
            }
          }
        } else {
          if (alive) setIsProfileComplete(true);
        }
      } catch (err) {
        // Greška na role endpointu (npr. 401/403) -> tu ima smisla fallback
        console.error(
          "Greška pri dohvaćanju role:",
          err?.response?.data || err
        );
        if (!alive) return;
        setRole(""); // nema role / neautorizirano / sl.
        setIsProfileComplete(false);
      } finally {
        if (alive) setLoading(false);
      }
    };

    setLoading(true);
    loadUserData();

    return () => {
      alive = false;
    };
  }, [token]);

  if (loading || role === null) return <div>Učitavanje...</div>;

  const pathname = location.pathname;
  const isRolePage = pathname === "/role";
  const editPath = `/profile/${role}/edit`;
  const homePath = `/home/${role}`;
  const isMyEditPage = pathname === editPath;

  // 1) Nema role -> /role
  if (role === "") {
    if (isRolePage) return children;
    return <Navigate to="/role" replace />;
  }

  // 2) Instruktor bez profila/bio -> na edit
  if (!isProfileComplete) {
    if (isMyEditPage) return children;
    return <Navigate to={editPath} replace />;
  }

  // 3) Ne dozvoli /role ili tuđi edit
  if (isRolePage || (pathname.startsWith("/profile/") && !isMyEditPage)) {
    return <Navigate to={homePath} replace />;
  }

  // 4) Role-based zaštita
  if (allowed.length > 0 && !allowed.includes(role)) {
    return <Navigate to={homePath} replace />;
  }

  return children;
}
