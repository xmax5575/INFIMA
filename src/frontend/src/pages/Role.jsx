import { useState } from "react";
import api from "../api";
import { ACCESS_TOKEN } from "../constants";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";

function Role() {
  const [role, setRole] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!role) {
      alert("Molimo odaberite ulogu!");
      return;
    }
    try {
      const token = localStorage.getItem(ACCESS_TOKEN);
      await api.patch(
        "/api/user/set_role/",
        { role },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Uloga uspješno postavljena!");
      navigate("/"); // ili na neku drugu stranicu
    } catch (error) {
      console.error(error);
      alert("Došlo je do pogreške prilikom postavljanja uloge.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#3674B5] to-[#A1E3F9] text-[#D1F8EF] flex flex-col items-center justify-center font-[Outfit]">
      <Header />
      <h1 className="text-3xl mb-6 font-bold">Odaberite svoju ulogu</h1>
      <div className="flex gap-6 mb-6">
        <button
          className={`px-6 py-3 rounded-lg ${
            role === "student" ? "bg-[#578FCA]" : "bg-[#A1E3F9] text-[#3674B5]"
          }`}
          onClick={() => setRole("student")}
        >
          Učenik
        </button>
        <button
          className={`px-6 py-3 rounded-lg ${
            role === "instructor" ? "bg-[#578FCA]" : "bg-[#A1E3F9] text-[#3674B5]"
          }`}
          onClick={() => setRole("instructor")}
        >
          Instruktor
        </button>
      </div>
      <button
        onClick={handleSubmit}
        className="bg-[#3674B5] px-8 py-3 rounded-xl text-[#D1F8EF] font-semibold hover:scale-105 transition-transform"
      >
        Potvrdi
      </button>
    </div>
  );
}

export default Role;
