import { useState, useEffect } from "react";
import api from "../api";
import { ACCESS_TOKEN } from "../constants";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";

function normalizeRole(r) {
  if (!r) return "";
  return String(r).toLowerCase();
}

function Role() {
  const [role, setRole] = useState("");
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    api
      .get("/api/user/role/")
      .then((res) => {
        const existingRole = normalizeRole(res.data?.role);
        if (existingRole) {
          // ✅ Ako korisnik već ima ulogu, ProtectedRoute će ga automatski
          // usmjeriti na Home (student) ili Edit (instruktor bez bio).
          // Ovdje ga šaljemo na home, a ProtectedRoute će odraditi ostalo.
          navigate(`/home/${existingRole}`, { replace: true });
        }
      })
      .catch(() => {});
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!role) {
      setError(true);
      return;
    }

    try {
      const res = await api.post("/api/select-role/", { role });
      const newRole = normalizeRole(res.data?.role) || normalizeRole(role);

      // ✅ NOVA LOGIKA NAVIGACIJE:
      if (newRole === "student") {
        // Studenti nemaju bio -> šalji ih odmah na Home
        navigate(`/home/student`, { replace: true });
      } else {
        // Instruktori moraju na Edit zbog biografije
        navigate(`/profile/instructor/edit`, { replace: true });
      }
    } catch (err) {}
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#3674B5] to-[#A1E3F9] text-[#D1F8EF] flex flex-col items-center justify-center font-[Outfit]">
      <Header />
      <h1 className="text-3xl mb-6 font-bold">Odaberite svoju ulogu</h1>

      <div className="flex gap-6 mb-5">
        <button
          type="button"
          className={`w-44 h-12 rounded-full font-semibold transition-all duration-300 ease-in-out ${
            role === "student"
              ? "bg-[#578FCA] border-2 border-[#D1F8EF] text-[#D1F8EF] hover:shadow-[0_0_25px_rgba(209,248,239,0.8)] hover:scale-105"
              : "bg-[#A1E3F9] text-[#3674B5]"
          }`}
          onClick={() => {
            setRole("student");
            setError(false);
          }}
        >
          Učenik
        </button>

        <button
          type="button"
          className={`w-44 h-12 rounded-full font-semibold transition-all duration-300 ease-in-out ${
            role === "instructor"
              ? "bg-[#578FCA] border-2 border-[#D1F8EF] text-[#D1F8EF] hover:shadow-[0_0_25px_rgba(209,248,239,0.8)] hover:scale-105"
              : "bg-[#A1E3F9] text-[#3674B5]"
          }`}
          onClick={() => {
            setRole("instructor");
            setError(false);
          }}
        >
          Instruktor
        </button>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        className={`px-8 py-3 rounded-full font-semibold transition-all duration-300 ease-in-out ${
          error
            ? "bg-[#3674B5] text-[#D1F8EF] hover:scale-105 animate-[pulse-slow_1s_ease-in-out_infinite]"
            : "bg-[#3674B5] text-[#D1F8EF] hover:scale-105"
        }`}
      >
        Potvrdi
      </button>
    </div>
  );
}

export default Role;
