import { useEffect, useState } from "react";
import api from "../api";
import { ACCESS_TOKEN } from "../constants";
import { Link } from "react-router-dom";

function Header() {
  const [user, setUser] = useState(null);

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
    <header className="fixed top-0 left-0 w-full z-50 bg-[#3674B5]/80 backdrop-blur-sm flex flex-wrap justify-between items-center px-6 sm:px-16 py-6 text-[#D1F8EF]">
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
              className="bg-[#D1F8EF] text-[#3674B5] px-4 py-1 rounded hover:scale-105 transition-transform"
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
