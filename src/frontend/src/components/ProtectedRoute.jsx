import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import api from "../api";
import { ACCESS_TOKEN } from "../constants";

const norm = (v) => (v ? String(v).toLowerCase() : "");

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const location = useLocation();
  const navigate = useNavigate(); // Koristimo useNavigate za preusmjeravanje
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
          setIsProfileComplete(false); // Postavljamo isProfileComplete na false
          setLoading(false);
        }
        return;
      }

      try {
        // 1. Dohvati ulogu
        const roleRes = await api.get("/api/user/role/");
        const r = norm(roleRes.data?.role);

        setRole(r || "");  // Set role odmah nakon što je dohvaćena

        // 2. Ako je instruktor, pokušaj dohvatiti podatke za instruktora
        if (r === "instructor") {
          const profileRes = await api.get("/api/instructor/inf/");
          const bio = profileRes.data?.bio;
          const hasBio = typeof bio === 'string' && bio.trim() !== "";
          setIsProfileComplete(hasBio); // Ako je instruktor, postavljamo status biografije
        } else {
          // Ako nije instruktor, postavljamo isProfileComplete na true za studente
          setIsProfileComplete(true);
        }
      } catch (err) {
        console.error("Greška pri dohvaćanju podataka:", err?.response?.data || err);
        setRole(""); // Ako dođe do greške, postavi role na ""
        setIsProfileComplete(false); // Nema biografije za instruktora
      } finally {
        if (alive) setLoading(false);
      }
    };

    if (token) {
      setLoading(true);
      loadUserData();
    } else {
      setLoading(false);
    }

    return () => {
      alive = false;
    };
  }, [token]);  // Provodi se svaki put kad se token promijeni

  // Provjera učitavanja i stanja role
  if (loading || role === null) {
    return <div>Učitavanje...</div>; // Prikazivanje indikatora učitavanja
  }

  const pathname = location.pathname;
  const isRolePage = pathname === "/role";
  const editPath = `/profiles/${role}/edit`;
  const homePath = `/home/${role}`;
  const isMyEditPage = pathname === editPath;
  const isHomePage = pathname.startsWith("/home/");
  const isAnyEditPage = pathname.startsWith("/profiles/") && pathname.endsWith("/edit");

  // 1) Nema role, mora otići na /role
  if (role === "") {
    if (isRolePage) return children;
    return <Navigate to="/role" replace />;
  }

  // 2) Nema biografije (ako je instruktor), mora otići na /profile/:role/edit
  if (!isProfileComplete) {
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
    return <Navigate to={editPath} replace />;
  }

  // 3) Ako je student ili instruktor s biografijom, ali pokušava otići na /role ili tuđi/krivi edit
  if (isRolePage || (pathname.startsWith("/profiles/") && !isMyEditPage)) {
    return <Navigate to={homePath} replace />;
  }

  // 4) Role-based zaštita: instruktor ne može na /home/student i obrnuto
  if (allowed.length > 0 && !allowed.includes(role)) {
    return <Navigate to={homePath} replace />;
  }

 
  return children;
}
