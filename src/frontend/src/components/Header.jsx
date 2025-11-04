import { useEffect, useState } from "react";
import api from "../api";
import { ACCESS_TOKEN } from "../constants";

function Header() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (token) {
      api
        .get("/api/user/profile/", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setUser(res.data))
        .catch(() => setUser(null));
    }
  }, []);

  return (
    <header className="fixed top-0 left-0 w-full z-50 flex flex-wrap justify-between items-center px-6 sm:px-16 py-6 text-[#D1F8EF]">
      <a
        href="/"
        className="text-2xl sm:text-3xl font-bold tracking-widest hover:scale-105 transition-transform"
      >
        INFIMA
      </a>

      <nav className="flex space-x-6 sm:space-x-16 text-lg sm:text-2xl mt-4 sm:mt-0">
        {user ? (
          <>
            <span>
              {user.first_name} {user.last_name}
            </span>
            <a
              href="/logout"
              className="bg-[#A1E3F9] text-[#3674B5] px-4 py-1 rounded hover:scale-105 transition-transform"
            >
              Odjava
            </a>
          </>
        ) : (
          <>
            <a
              href="/register"
              className="hover:transform transition-transform duration-200 hover:scale-105"
            >
              Registracija
            </a>
            <a
              href="/login"
              className="hover:transform transition-transform duration-200 hover:scale-105"
            >
              Prijava
            </a>
          </>
        )}
      </nav>
    </header>
  );
}

export default Header;
