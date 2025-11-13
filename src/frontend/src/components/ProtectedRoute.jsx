import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import api from "../api";
import { ACCESS_TOKEN } from "../constants";

function ProtectedRoute({ children, allowedRoles = [] }) {
  const token = localStorage.getItem(ACCESS_TOKEN);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    // Dohvati ulogu korisnika, pri promijeni tokena.
    api
      .get("/api/user/role/", {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      })
      .then((res) => setUserRole(res.data.role || null))
      .catch(() => setUserRole(null))
      .finally(() => setLoading(false));
  }, [token]);

  // Ako korisnik nije prijavljen odi na /login rutu.
  if (!token) return <Navigate to="/login" replace />;
  if (loading) return null;

  // Ako je na /role:
  if (location.pathname === "/role") {
    // Ako nema role -> prikaži <Role />.
    if (!userRole) return children;
    // Ako ima role -> pošalji ga na njegov home.
    return <Navigate to={`/home/${userRole.toLowerCase()}`} replace />;
  }

  // Za sve druge rute: ako nema role -> prisilno na /role.
  if (!userRole) return <Navigate to="/role" replace />;

  // Role-based zaštita, dopušta samo instruktorima na home/instructor i studentima na home/student.
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to={`/home/${userRole.toLowerCase()}`} replace />;
  }

  return children;
}

export default ProtectedRoute;
