import { useState, useEffect } from "react";
import { ACCESS_TOKEN } from "../constants";
import api from "../api";

// Forma koja se otvara kad instruktor stisne plus, odnosno kad želi dodati termin.
export default function TerminForm({ onCreated, onClose }) {
  const [subject, setSubject] = useState("");
  const [level, setLevel] = useState("");
  const [maxStudents, setMaxStudents] = useState("");
  const [format, setFormat] = useState("");
  const [duration, setDuration] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [validationError, setValidationError] = useState(null);

  // Provjeramo je li korisnik prijavljen i ako je dohvaćamo podatke o njemu
  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (!token) return;
    api
      .get("/api/user/profile/", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .catch(() => {});
  }, []);

  // Funkcija koja se poziva kad instruktor submita formu, odnosno doda termin.
  const addLesson = async (e) => {
    e.preventDefault();
    setValidationError(null);

    const token = localStorage.getItem(ACCESS_TOKEN);
    if (!token) {
      setValidationError("Niste prijavljeni.");
      return;
    }

    // Pretvaramo potrebne podatke u Number.
    const pMax = Number(maxStudents);
    const pDur = Number(duration);

    // Validacija podataka i provjera.
    if (!date || !time) {
      setValidationError("Morate izabrati i datum i vrijeme.");
      return;
    }
    if (!Number.isInteger(pMax) || pMax <= 0) {
      setValidationError("Broj studenata mora biti pozitivan cijeli broj.");
      return;
    }
    if (!Number.isInteger(pDur) || pDur <= 0) {
      setValidationError("Trajanje mora biti pozitivan cijeli broj minuta.");
      return;
    }

    // TimeField očekuje HH:MM:SS.
    const timeHHMMSS = time.length === 5 ? `${time}:00` : time;

    // Termin mora biti u budućnosti
    const when = new Date(`${date}T${timeHHMMSS}`);

    if (when.getTime() <= Date.now()) {
      setValidationError(
        "Izabrani datum i vrijeme moraju biti veći od trenutnog."
      );
      return;
    }

    // Mapiranje razine instrukcija.
    const levelMapped =
      level === "Osnovna" ? "OSNOVNA" : level === "Srednja" ? "SREDNJA" : "";

    const payload = {
      subject: subject,
      duration_min: Number(pDur),
      max_students: Number(pMax),
      format, // "Uživo" | "Online".
      date, // "YYYY-MM-DD".
      time: timeHHMMSS, // "HH:MM:SS".
      level: levelMapped, // "OSNOVNA" | "SREDNJA".
    };

    try {
      const res = await api.post("/api/lessons/", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Reset forme kad instruktor doda termin.
      setSubject("");
      setLevel("");
      setMaxStudents("");
      setFormat("");
      setDuration("");
      setDate("");
      setTime("");

      // javi parentu i zatvori modal
      onCreated && onCreated(res.data);
      onClose && onClose();
    } catch (err) {
      const msg = err.message;
      setValidationError(`Greška pri spremanju: ${msg}`);
    }
  };

  return (
    <form
      onSubmit={addLesson}
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
          min={1}
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

      {validationError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4 text-sm font-medium">
          {validationError}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4">
        <button
          type="button"
          onClick={onClose}
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
