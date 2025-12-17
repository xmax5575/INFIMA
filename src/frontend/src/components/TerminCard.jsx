import React, { useState, useEffect } from "react";
import axios from "axios";
import { MapPin } from "lucide-react";
import InstructorCard from "./InstructorCard";  // Komponenta koja iscrtava profil instruktora
import api from "../api";

// Funkcija za dohvaćanje inicijala osobe.
function initials(name) {
  if (!name) return "IN";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

// Funkcija za formatiranje datuma.
function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString("hr-HR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Funkcija za formatiranje vremena.
function formatTime(t) {
  if (!t) return "";
  const [h, m] = String(t).split(":");
  return `${h}:${m} h`;
}

export default function TerminCard({ termin, onClick, role }) {
  const {
    level,
    format,
    price,
    date,
    time,
    max_students,
    location,
    instructor_display,
    instructor_id,
  } = termin || {};

  const [showInstructor, setShowInstructor] = useState(false);  // State za prikazivanje profila instruktora
  const [instructorProfile, setInstructorProfile] = useState(null);  // Spremanje podataka o instruktoru
  const [loadingInstructor, setLoadingInstructor] = useState(false);  // State za učitavanje podataka instruktora

  const title =
    instructor_display ??
    (instructor_id != null
      ? `Instruktor #${instructor_id}`
      : "Nepoznat instruktor");

  const when =
    date || time
      ? `${formatDate(date)}${date && time ? " • " : ""}${formatTime(time)}`
      : "Datum i vrijeme nisu definirani";

  // Funkcija za dohvat podataka o instruktoru putem ID-a
 
  const fetchInstructorData = async (id) => {
    setLoadingInstructor(true);
    try {
      const response = await api.get(`/api/instructor/${id}/`);  // Poziv prema backendu za profil instruktora
      console.log(response.data);
      setInstructorProfile(response.data);  // Spremamo podatke instruktora u state
    } catch (error) {
      console.error("Greška pri dohvaćanju podataka o instruktoru", error);
    } finally {
      setLoadingInstructor(false);
    }
  };

 //KAD KARLO DOVRSI PREKO ID OVO CE RADIT I VRACAT CE DOBRE PODATKE

  // Toggle funkcija za prikazivanje instruktora
  const toggleInstructor = () => {
    if (!showInstructor && instructor_id) {
      console.log(instructor_id)
      fetchInstructorData(instructor_id);  // Ako je instruktor, dohvatiti podatke
    }
    setShowInstructor(!showInstructor);  // Prebacivanje između prikaza i skrivanja profila
  };

  return (
    <>
    <article
      className="
        group rounded-2xl border border-white/60 bg-[#D1F8EF] text-[#3674B5]
        shadow-sm hover:shadow-md transition p-4 md:p-5 max-w-xl select-none
        hover:-translate-y-[1px] cursor-default
      "
    >
      {/* Header: avatar + ime + cijena. */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-full bg-white/80 border border-white/70
              flex items-center justify-center text-sm font-bold"
            title={title}
          >
            {initials(instructor_display)}
          </div>
          <div className="min-w-0">
            <div className="text-xs opacity-80">Instruktor</div>
            {role === "student" ? (
              <button className="font-semibold truncate" title={title} onClick={toggleInstructor}>
                {title}
              </button>
            ) : (
              <span className="font-semibold truncate" title={title}>
                {title}
              </span>
            )}
          </div>
        </div>

        <div
          className="shrink-0 rounded-xl bg-white/90 border border-white/70 px-3 py-1
            text-sm font-bold"
        >
          {price != null ? `${price} €` : "—"}
        </div>
      </div>

      {/* Sredina: razina + format + max_students. */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-[11px] px-2 py-1 rounded-full bg-[#A1E3F9]/50 border border-white/60">
          {level ?? "Razina"}
        </span>
        <span className="text-[11px] px-2 py-1 rounded-full bg-white/70 border border-white/60">
          {format ?? "Format"}
        </span>
        {max_students != null && (
          <span className="text-[11px] px-2 py-1 rounded-full bg-white/70 border border-white/60">
            max {max_students}
          </span>
        )}
      </div>

      {/* Donji dio: kada i gdje. */}
      <div className="mt-3 text-sm flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#3674B5]" />
          <span className="opacity-90">{when}</span>
        </div>

        {location ? (
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#3674B5]" />
            <span className="opacity-90">{location}</span>
          </div>
        ) : null}
      </div>

      {/* Ako je osoba student dodaj button za rezervaciju, ako je instruktor za detalje */}
      <div className="mt-4">
        <button
          className="
              rounded-xl bg-[#3674B5] text-white text-sm font-medium
              px-3 py-2 hover:opacity-90 transition
            "
          onClick={onClick}
        >
          {role === "student" ? "Rezerviraj" : "Detalji termina"}
        </button>
      </div>
    </article>
   {showInstructor  && (
  <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" onClick={() => setShowInstructor(false)}>
    <div onClick={(e) => e.stopPropagation()} className="w-full max-w-6xl max-h-[85vh] overflow-y-auto">
      <InstructorCard
        user={instructorProfile}  // Prosljeđivanje podataka o instruktoru
        onClose={() => setShowInstructor(false)}  // Zatvaranje profila
      />
    </div>
  </div>
)}
</>

  );
}
