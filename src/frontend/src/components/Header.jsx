import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import api from "../api";
import { ACCESS_TOKEN } from "../constants";
import { Link } from "react-router-dom";
import { CircleUser } from "lucide-react";
import InstructorCard from "./InstructorCard";
import StudentCard from "../components/StudentCard"

function Header() {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const menuRef = useRef(null);

  // Dohvati rutu.
  const location = useLocation();

  // Zatvori menu kad promijeniš rutu
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onPointerDown = (e) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setMenuOpen(false);
    };

    const onKeyDown = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };

    // Ako korisnik klikne bilo gdje na stranici želimo uhvatiti to ako je na desktopu, mobitelu ili tipkovnici
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      // Uzmi access token iz localStoragea gdje se on nalazi.
      const token = localStorage.getItem(ACCESS_TOKEN);
      if (!token) {
        setUser(null); // Ako access token ne postoji znaci da korisnik nije prijavljen, odnosno null je.
        return;
      }

      try {
        // Dohvaćamo podatke o profilu korisnika s backend rute.
        const res = await api.get("/api/user/profile/", {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });

        // Postavljamo usera na korisnika kojeg nam je vratio backend.
        setUser(res.data);
      } catch (err) {
        console.error("Greška pri dohvaćanju korisnika:", err);
        setUser(null);
      }
    };

    fetchUser();
  }, []);

  // Ako naš korisnik postoji i ako ima ulogu treba ga redirectati na stranicu za njegovu ulogu.
  const homeLink = user && user.role ? `/home/${user.role.toLowerCase()}` : "/";

  // Vraćamo header ovisno o tome je li korisnik prijavljen ili nije.
  return (
    <>
    <header className="fixed top-0 left-0 w-full z-50 bg-[#3674B5]/80 backdrop-blur-sm flex flex-wrap justify-between items-center px-6 sm:px-16 py-6 text-[#D1F8EF]">
      <Link
        to={homeLink}
        className="text-2xl sm:text-3xl font-bold tracking-widest hover:scale-105 transition-transform"
      >
        INFIMA
      </Link>

      <nav className="flex space-x-6 sm:space-x-8 text-lg sm:text-2xl mt-4 sm:mt-0">
        {user ? (
          <>
            <span ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition"
              >
                <CircleUser className="h-7 w-7" />
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 mt-2 w-40 rounded-xl border border-white/10 bg-[#3674B5]/95 backdrop-blur shadow-xl overflow-hidden z-50"
                  role="menu"
                >
                  <button
                    type="button"
                    className="block w-full text-left px-4 py-2 text-base text-[#D1F8EF] hover:bg-white/10"
                    onClick={() => {
                      setMenuOpen(false);
                      setShowProfile(true);
                    }}
                  >
                    Profil
                  </button>

                  <Link
                    to="/logout"
                    className="block px-4 py-2 text-base text-[#D1F8EF] hover:bg-white/10"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                  >
                    Odjava
                  </Link>
                </div>
              )}
            </span>
            <span>
              {user.first_name} {user.last_name}
            </span>
          </>
        ) : (
          <>
            <Link
              to="/register"
              className="hover:transform transition-transform duration-200 hover:scale-105"
            >
              Registracija
            </Link>
            <Link
              to="/login"
              className="hover:transform transition-transform duration-200 hover:scale-105"
            >
              Prijava
            </Link>
          </>
        )}
      </nav>
    </header>
    {showProfile && (
      <div
        className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
        onClick={() => setShowProfile(false)}
      >
        <div onClick={(e) => e.stopPropagation()} className="w-full max-w-6xl max-h-[85vh] overflow-y-auto">
          {/* ovdje renderaš karticu */}
          {user.role.toLowerCase() === "instructor"? <InstructorCard user={user} onClose={() => setShowProfile(false)} />:
          <StudentCard/>
}
        </div>
      </div>
    )}
    </>
  );
}

export default Header;
