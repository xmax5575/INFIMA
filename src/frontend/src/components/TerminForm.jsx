import { useState, useEffect } from "react";
import { ACCESS_TOKEN } from "../constants";
import api from "../api";

function TerminForm() {
  const [subject, setSubject] = useState("");
  const [level, setLevel] = useState("");
  const [maxStudents, setMaxStudents] = useState("");
  const [format, setFormat] = useState("");
  const [duration, setDuration] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [instructor, setInstructor] = useState(null);
  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (token) {
      api
        .get("/api/user/profile/", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setInstructor(res.data))
        .catch(() => setInstructor(null));
    }
  }, []);

  const handleSubmit = (e) => {
  e.preventDefault();

  const parsedPrice = parseFloat(price);
  if (isNaN(parsedPrice) || parsedPrice <= 0) {
    setValidationError("Cijena mora biti pozitivan broj veći od nule.");
    return;
  }
  if(maxStudents <= 0){
    setValidationError("Broj studenata mora biti pozitivan");
  }

  if (!date || !time) {
    setValidationError("Morate izabrati i datum i vrijeme.");
    return;
  }

  const izabraniDateTime = new Date(`${date}T${time}:00`);
  if (izabraniDateTime.getTime() <= new Date().getTime()) {
    setValidationError(
      "Izabrani datum i vrijeme moraju biti veci od trenutnog."
    );
    return;
  }

  console.log(
    instructor,
    subject,
    format,
    duration,
    date,
    time,
    format === "Uživo" ? location : "Online",
    price,
    maxStudents,
    level
  );
  setShowForm(false);
};


  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 sm:gap-3 w-full max-w-md mx-auto text-[#3674B5]"
    >
      <div>
        <label className="block text-sm sm:text-base font-semibold mb-1">
          Predmet
        </label>
        <select
          className="w-full p-2 sm:p-3 border rounded focus:ring-2 focus:ring-[#3674B5]/40 outline-none text-sm sm:text-base"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        >
          <option value="">Odaberite predmet</option>
          <option value="Matematika">Matematika</option>
          <option value="Informatika">Informatika</option>
          <option value="Fizika">Fizika</option>
        </select>
      </div>
      <div>
        <label className="block text-sm sm:text-base font-semibold mb-1">
          Razina
        </label>
        <select
          className="w-full p-2 sm:p-3 border rounded focus:ring-2 focus:ring-[#3674B5]/40 outline-none text-sm sm:text-base"
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          required
        >
          <option value="">Odaberite razinu</option>
          <option value="Osnovna">Osnovna škola</option>
          <option value="Srednja">Srednja škola</option>
        </select>
      </div>
      <div>
        <label className="block text-sm sm:text-base font-semibold mb-1">
          Format
        </label>
        <select
          className="w-full p-2 sm:p-3 border rounded focus:ring-2 focus:ring-[#3674B5]/40 outline-none text-sm sm:text-base"
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          required
        >
          <option value="">Odaberite format</option>
          <option value="Uživo">Uživo</option>
          <option value="Online">Online</option>
        </select>
      </div>
      <div>
        <label className="block text-sm sm:text-base font-semibold mb-1">
          Max broj polaznika
        </label>
        <input
          type="number"
          className="w-full p-2 sm:p-3 border rounded focus:ring-2 focus:ring-[#3674B5]/40 outline-none text-sm sm:text-base"
          value={maxStudents}
          onChange={(e) => setMaxStudents(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block text-sm sm:text-base font-semibold mb-1">
          Trajanje
        </label>
        <select
          className="w-full p-2 sm:p-3 border rounded focus:ring-2 focus:ring-[#3674B5]/40 outline-none text-sm sm:text-base"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          required
        >
          <option value="">Odaberite trajanje</option>
          <option value="30">30 minuta</option>
          <option value="45">45 minuta</option>
          <option value="60">60 minuta</option>
          <option value="90">90 minuta</option>
          <option value="120">120 minuta</option>
        </select>
      </div>

      <div>
        <label className="block text-sm sm:text-base font-semibold mb-1">
          Datum
        </label>
        <input
          type="date"
          className="w-full p-2 sm:p-3 border rounded focus:ring-2 focus:ring-[#3674B5]/40 outline-none text-sm sm:text-base"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block text-sm sm:text-base font-semibold mb-1">
          Vrijeme
        </label>
        <input
          type="time"
          className="w-full p-2 sm:p-3 border rounded focus:ring-2 focus:ring-[#3674B5]/40 outline-none text-sm sm:text-base"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          required
        />
      </div>

      {format === "Uživo" && (
        <div>
          <label className="block text-sm sm:text-base font-semibold mb-1">
            Lokacija
          </label>
          <input
            type="text"
            className="w-full p-2 sm:p-3 border rounded focus:ring-2 focus:ring-[#3674B5]/40 outline-none text-sm sm:text-base"
            placeholder="npr. Autoškola Zagreb"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
        </div>
      )}

      <div>
        <label className="block text-sm sm:text-base font-semibold mb-1">
          Cijena (EUR)
        </label>
        <input
          type="number"
          min="0"
          step="0.5"
          className="w-full p-2 sm:p-3 border rounded focus:ring-2 focus:ring-[#3674B5]/40 outline-none text-sm sm:text-base"
          placeholder="npr. 20"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
      </div>

      {validationError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4 text-sm font-medium">
          {validationError}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4">
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="text-[#3674B5] font-semibold hover:underline text-sm sm:text-base"
        >
          Odustani
        </button>
        <button
          type="submit"
          className="bg-[#3674B5] text-[#D1F8EF] px-4 py-2 sm:px-5 sm:py-2 rounded-lg hover:scale-105 transition-transform text-sm sm:text-base"
        >
          Spremi
        </button>
      </div>
    </form>
  );
}

export default TerminForm;
