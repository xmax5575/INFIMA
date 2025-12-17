import { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../api";
import { ACCESS_TOKEN } from "../constants";
import { CircleUser } from "lucide-react";
import InstructorCard from "./InstructorCard";
import StudentCard from "../components/StudentCard";

function Header() {
  const [user, setUser] = useState(null);
  const [instructor, setInstructor] = useState(null); // <-- instruktorski detalji
  const [menuOpen, setMenuOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const menuRef = useRef(null);
  const location = useLocation();

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

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  // Dohvati usera
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem(ACCESS_TOKEN);
      const looksLikeJwt = token && token.split(".").length === 3;

      if (!token || token === "null" || token === "undefined" || !looksLikeJwt) {
        setUser(null);
        setInstructor(null);
        return;
      }

      try {
        const res = await api.get("/api/user/profile/");
        setUser(res.data);
      } catch (err) {
        if (err?.response?.status === 401) {
          localStorage.removeItem(ACCESS_TOKEN);
        }
        setUser(null);
        setInstructor(null);
      }
    };

    fetchUser();
  }, [location.pathname]);

  // Klik na "Profil" -> povuci instruktorske detalje pa otvori modal
  const openProfile = async () => {
    setMenuOpen(false);

    // Ako nije loginan user, samo nemoj ništa
    if (!user) return;

    try {
      if (user?.role?.toLowerCase() === "instructor") {
        const res = await api.get("/profiles/instructor/inf/");
        console.log("GET /profiles/instructor/inf/ =>", res.data);
        setInstructor(res.data);
      } else {
        setInstructor(null);
      }
    } catch (err) {
      console.log(
        "GET /profiles/instructor/inf/ error:",
        err?.response?.status,
        err?.response?.data || err
      );
      setInstructor(null);
    } finally {
      setShowProfile(true);
    }
  };

  const homeLink = user?.role ? `/home/${user.role.toLowerCase()}` : "/";

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
                      onClick={openProfile}
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

      {showProfile && user && (
        <div
          className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
          onClick={() => setShowProfile(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-6xl max-h-[85vh] overflow-y-auto"
          >
            {user.role?.toLowerCase() === "instructor" ? (
              <InstructorCard
                // merge: user (ime/role) + instructor (bio/price/subjects...)
                user={{ ...user, ...(instructor || {}) }}
                canEdit={true}
                editTo = {`/profiles/${user.role.toLowerCase()}/edit`}
                onClose={() => setShowProfile(false)}
              />
            ) : (
              <StudentCard />
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default Header;
