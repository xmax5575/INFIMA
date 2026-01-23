import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { ACCESS_TOKEN } from "../constants";
import LoadingPage from "./LoadingPage";

//rješavanje putanje /, provjera prijave odnosno tokena te dohvat uloge
const norm = (v) => (v ? String(v).toLowerCase() : "");

//normalizacija role stringa radi formata /home/role
export default function HomeRedirect() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    //ako nema tokena korisnik nije prijavljen -  baca ga na login
    const go = async () => {
      const token = localStorage.getItem(ACCESS_TOKEN);
      if (!token) {
        if (alive) navigate("/login", { replace: true });
        return;
      }

      try {
        //saznajemo role
        const res = await api.get("/api/user/role/");
        const role = norm(res.data?.role);

        //ako role nije postavljen biramo ga, inače šalje na odgovarajuću stranicu
        if (!role) {
          navigate("/role", { replace: true });
        } else {
          navigate(`/home/${role}`, { replace: true });
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
