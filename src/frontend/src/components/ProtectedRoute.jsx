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
        if (alive) {
          setRole(null);
          setLoading(false);
        }
        return;
      }

      try {
        // 1. Dohvati ulogu
        const roleRes = await api.get("/api/user/role/");
        const r = norm(roleRes.data?.role);

        // 2. Dohvati profil
        const profileRes = await api.get("/api/user/profile/");

        if (!alive) return;

        setRole(r || "");

        // LOGIKA KOMPLETNOSTI:
        // Ako je student -> profil je kompletan čim postoji uloga.
        // Ako je instruktor -> provjeravamo postoji li biografija.
        if (r === "student") {
          setIsProfileComplete(true);
        } else if (r === "instructor") {
          const hasBio =
            !!profileRes.data?.bio && profileRes.data.bio.trim() !== "";
          setIsProfileComplete(hasBio);
        } else {
          setIsProfileComplete(false);
        }
      } catch (err) {
        if (!alive) return;
        setRole("");
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

  // 1) Nije prijavljen
  if (!token)
    return <Navigate to="/login" replace state={{ from: location }} />;

  // Čekaj dok se podaci ne učitaju
  if (loading || role === null) return null;

  const pathname = location.pathname;
  const isRolePage = pathname === "/role";
  const editPath = `/profile/${role}/edit`;
  const homePath = `/home/${role}`;
  const isMyEditPage = pathname === editPath;

  // 2) NEMA ROLE -> smije samo na /role (npr. tek se registrirao)
  if (role === "") {
    if (isRolePage) return children;
    return <Navigate to="/role" replace />;
  }

  // 3) IMA ROLE (Instruktor), ALI NEMA BIO -> baci ga na edit dok ne popuni
  if (!isProfileComplete) {
    if (isMyEditPage) return children;
    return <Navigate to={editPath} replace />;
  }

  // 4) SVE JE OK (Student ili Instruktor s biografijom)
  // Ako pokuša otići na /role ili tuđi/krivi edit, vrati ga na njegov home
  if (isRolePage || (pathname.startsWith("/profile/") && !isMyEditPage)) {
    return <Navigate to={homePath} replace />;
  }

  // 5) Role-based zaštita (Instruktor ne može na /home/student i obrnuto)
  if (allowed.length > 0 && !allowed.includes(role)) {
    return <Navigate to={homePath} replace />;
  }

  return children;
}
