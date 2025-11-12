import { useEffect, useState } from "react";
import api from "../api";
import { ACCESS_TOKEN } from "../constants";
import { Link } from "react-router-dom";

function Header() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem(ACCESS_TOKEN);
      if (!token) {
        setUser(null);
        return;
      }

      try {
        const res = await api.get("/api/user/profile/", {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        setUser(res.data);
      } catch (err) {
        console.error("Greška pri dohvaćanju korisnika:", err);
        setUser(null);
      }
    };

    fetchUser();
  }, []);

  const homeLink =
    user && user.role ? `/home/${user.role.toLowerCase()}` : "/";

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-blue/10 backdrop-blur-md flex flex-wrap justify-between items-center px-6 sm:px-16 py-6 text-[#D1F8EF]">
      <Link
        to={homeLink}
        className="text-2xl sm:text-3xl font-bold tracking-widest hover:scale-105 transition-transform"
      >
        INFIMA
      </Link>

      <nav className="flex space-x-6 sm:space-x-16 text-lg sm:text-2xl mt-4 sm:mt-0">
        {user ? (
          <>
            <span>
              {user.first_name} {user.last_name}
            </span>
            <Link
              to="/logout"
              className="bg-[#A1E3F9] text-[#3674B5] px-4 py-1 rounded hover:scale-105 transition-transform"
            >
              Odjava
            </Link>
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
  );
}

export default Header;
