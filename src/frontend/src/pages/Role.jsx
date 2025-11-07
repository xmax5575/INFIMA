import { useState, useEffect } from "react";
import axios from "axios";
import api from "../api";
import { ACCESS_TOKEN } from "../constants";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";

function Role() {
  const [role, setRole] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (!token) {
      navigate("/login");
      return;
    }
    axios
      .get("/api/user/role/", {
        withCredentials: true,
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        console.log("Response iz API-ja:", res.data);
        console.log("Role vrijednost:", res.data.role);

        if (res.data.role) {
          console.log("Uloga korisnika:", res.data.role);
          navigate(`/home/${res.data.role.toLowerCase()}`);
        }
      })
      .catch((err) => console.error(err));
  }, [navigate]);

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!role) {
    alert("Molim odaberite ulogu prije potvrde.");
    return;
  }

  try {
    const token = localStorage.getItem(ACCESS_TOKEN);
    const res = await api.post(
      "/api/select-role/",
      { role },
      {
        withCredentials: true,
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log("Uloga uspješno postavljena!");
    console.log("Backend response:", res.data);

    // ako backend vraća role kao npr. "STUDENT" ili "INSTRUCTOR"
    navigate(`/home/${res.data.role.toLowerCase()}`);
  } catch (error) {
    console.error(error);
    alert("Došlo je do pogreške prilikom postavljanja uloge.");
  }
};


  return (
    <div className="min-h-screen bg-gradient-to-b from-[#3674B5] to-[#A1E3F9] text-[#D1F8EF] flex flex-col items-center justify-center font-[Outfit]">
      <Header />
      <h1 className="text-3xl mb-6 font-bold">Odaberite svoju ulogu</h1>
      <div className="flex gap-6 mb-5">
        <button
          className={`w-44 h-12 rounded-full font-semibold ${
            role === "student"
              ? "bg-[#578FCA] border-2 border-[#D1F8EF] text-[#D1F8EF] px-8 py-3 rounded-full font-semibold transition-all duration-300 ease-in-out hover:shadow-[0_0_25px_rgba(209,248,239,0.8)] hover:scale-105"
              : "bg-[#A1E3F9] text-[#3674B5]"
          }`}
          onClick={() => setRole("student")}
        >
          Učenik
        </button>
        <button
          className={`w-44 h-12 rounded-full font-semibold ${
            role === "instructor"
              ? "bg-[#578FCA] border-2 border-[#D1F8EF] text-[#D1F8EF] px-8 py-3 rounded-full font-semibold transition-all duration-300 ease-in-out hover:shadow-[0_0_25px_rgba(209,248,239,0.8)] hover:scale-105"
              : "bg-[#A1E3F9] text-[#3674B5]"
          }`}
          onClick={() => setRole("instructor")}
        >
          Instruktor
        </button>
      </div>
      <button
        onClick={handleSubmit}
        className="bg-[#3674B5] px-8 py-3 rounded-full text-[#D1F8EF] font-semibold hover:scale-105 transition-transform"
      >
        Potvrdi
      </button>
    </div>
  );
}

export default Role;
