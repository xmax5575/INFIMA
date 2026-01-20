import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import api from "../api";
import { ACCESS_TOKEN } from "../constants";
import LoadingPage from "../pages/LoadingPage"
const norm = (v) => (v ? String(v).toLowerCase() : "");

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const location = useLocation();
  const navigate = useNavigate();
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

        // 2) profil (instruktor + student)
        if (r === "instructor") {
          try {
            const profileRes = await api.get("/api/instructor/inf/");
            const bio = profileRes.data?.bio;
            const hasBio = typeof bio === "string" && bio.trim() !== "";
            const savedFlag =
              localStorage.getItem("profile_saved_instructor") === "1";
            if (alive) setIsProfileComplete(hasBio || savedFlag);
          } catch (err) {
            const status = err?.response?.status;
            const savedFlag =
              localStorage.getItem("profile_saved_instructor") === "1";
            if (status === 404) {
              if (alive) setIsProfileComplete(savedFlag);
            } else {
              console.error(
                "Greška pri dohvaćanju instructor profila:",
                err?.response?.data || err
              );
              if (alive) setIsProfileComplete(savedFlag);
            }
          }
        } else if (r === "student") {
          try {
            const profileRes = await api.get("/api/student/inf/");
            const goals = profileRes.data?.learning_goals;
            const hasGoals = typeof goals === "string" && goals.trim() !== "";
            const savedFlag =
              localStorage.getItem("profile_saved_student") === "1";
            if (alive) setIsProfileComplete(hasGoals || savedFlag);
          } catch (err) {
            const status = err?.response?.status;
            const savedFlag =
              localStorage.getItem("profile_saved_student") === "1";
            if (status === 404) {
              if (alive) setIsProfileComplete(savedFlag);
            } else {
              console.error(
                "Greška pri dohvaćanju student profila:",
                err?.response?.data || err
              );
              if (alive) setIsProfileComplete(savedFlag);
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
  }, [token, navigate]);

  // Ako se triggera profileUpdated event, odmah se prelazi na home page.
  useEffect(() => {
    const onProfileUpdated = (e) => {
      try {
        const detail = e?.detail ?? null;
        if (!detail || !detail.role) return;
        const r = String(detail.role).toLowerCase();

        // If we don't yet know the role, set it so the routing logic can proceed.
        setRole((current) => (current === null ? r : current));

        if (typeof detail.isProfileComplete === "boolean") {
          setIsProfileComplete(detail.isProfileComplete);
        } else {
          const savedFlag = localStorage.getItem(`profile_saved_${r}`) === "1";
          setIsProfileComplete(savedFlag);
        }

        // Remove the temporary saved flag so it can't be reused.
        try {
          localStorage.removeItem(`profile_saved_${r}`);
        } catch (e) {
          console.error("Failed to remove profile_saved flag:", e);
        }

        const editPathForRole = `/profile/${r}/edit`;
        if (
          location.pathname === editPathForRole ||
          location.pathname.startsWith(editPathForRole)
        ) {
          navigate(`/home/${r}`);
        }
      } catch (err) {
        console.error("Error handling profileUpdated event:", err);
      }
    };

    window.addEventListener("profileUpdated", onProfileUpdated);
    return () => window.removeEventListener("profileUpdated", onProfileUpdated);
  }, [location.pathname, navigate]);

  useEffect(() => {
  // loading gotov, ali nema role → redirect
  if (!loading && role === null) {
    navigate("/", { replace: true });
  }
}, [loading, role, navigate]); 
useEffect(() => {
  // čekaj da se sve učita
  if (loading) return;
  if (!token) return;

  // ako nije odabrao rolu ili profil nije kompletan, ne enforce-aj još
  if (!role || role === "" || !isProfileComplete) return;

  // dok je na /role ili edit profilu, nemoj ga prekidati
  if (location.pathname === "/role" || location.pathname.startsWith("/profile/")) return;

  let alive = true;

  (async () => {
    try {
      // backend kaže što je "na redu"
      const res = await api.get("/api/flow/next/");
      if (!alive) return;

      const target = res.data?.redirect_to; // npr. "/payment/306" ili "/review/306" ili "/summary/306"
      if (!target) return;

      // ako već je tamo, ne diraj
      if (location.pathname === target) return;

      // inače ga vrati na to što je na redu
      navigate(target, { replace: true });
    } catch (e) {
      // ignore (ne želimo rušiti routing ako flow endpoint padne)
    }
  })();

  return () => {
    alive = false;
  };
}, [loading, token, role, isProfileComplete, location.pathname, navigate, location.pathname, location]);

if (loading || role === null){
    return <LoadingPage/>
  }


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
