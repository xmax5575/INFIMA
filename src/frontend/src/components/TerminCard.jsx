import React, { useState } from "react";
import { MapPin } from "lucide-react";
import InstructorCard from "./InstructorCard";
import api from "../api";
import GoogleMapEmbed from "./GoogleMapEmbed";
import LogoLoader from "./LogoBulbProgress";
import LogoBulbProgress from "./LogoBulbProgress";

/* Helperi */
function initials(name) {
  if (!name) return "IN";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}

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

function formatTime(t) {
  if (!t) return "";
  const [h, m] = String(t).split(":");
  return `${h}:${m} h`;
}

export default function TerminCard({ termin, onReserve, role, canReserve, reserved, onClick}) {
  console.log(termin);
  const {
    level,
    format,
    price,
    date,
    duration_min,
    time,
    max_students,
    location,
    instructor_display,
    instructor_id,
    lesson_id,
  } = termin || {};

  const [showInstructor, setShowInstructor] = useState(false);
  const [instructorProfile, setInstructorProfile] = useState(null);
  const [loadingInstructor, setLoadingInstructor] = useState(false);

  const title =
    instructor_display ??
    (instructor_id ? `Instruktor #${instructor_id}` : "Instruktor");

  const when =
    date || time
      ? `${formatDate(date)}${date && time ? " • " : ""}${formatTime(time)}`
      : "—";

  const fetchInstructorData = async (id) => {
    if (!id) return;
    setLoadingInstructor(true);
    try {
      const res = await api.get(`api/instructor/${id}/`);
      setInstructorProfile(res.data);
    } catch (e) {
      console.error("Greška pri dohvaćanju instruktora", e);
    } finally {
      setLoadingInstructor(false);
    }
  };

  
  // Toggle funkcija za prikazivanje instruktora
  const toggleInstructor = () => {
    if (!showInstructor && instructor_id) {
      fetchInstructorData(instructor_id);
    }
    setShowInstructor((v) => !v);
  };
  return (
  <>
    <article className="rounded-2xl bg-[#D1F8EF] border border-white/60 p-4 text-[#3674B5] max-w-xl">

      {/* HEADER */}
      <div className="flex justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-bold">
            {initials(instructor_display)}
          </div>
          <div>
            <div className="text-xs opacity-70">Instruktor</div>
            {role === "student" ? (
              <button className="font-semibold" onClick={toggleInstructor}>
                {title}
              </button>
            ) : (
              <span className="font-semibold">{title}</span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl px-3 py-1 text-sm font-bold">
          {price != null && duration_min
            ? `${(price * duration_min) / 60} €`
            : "—"}
        </div>
      </div>

      {/* TAGOVI */}
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="px-2 py-1 rounded-full bg-white/70">
          {level ?? "Razina"}
        </span>
        <span className="px-2 py-1 rounded-full bg-white/70">
          {format ?? "Format"}
        </span>
        {max_students != null && (
          <span className="px-2 py-1 rounded-full bg-white/70">
            max {max_students}
          </span>
        )}
        <span className="px-2 py-1 rounded-full bg-white/70">
          {duration_min} min
        </span>
      </div>

      {/* DATUM / LOKACIJA */}
      <div className="mt-3 text-sm">
        <div>{when}</div>

        {location && format !== "Online" && (
          <div className="flex items-center gap-2 mt-1">
            <MapPin className="w-4 h-4" />
            <span>{location}</span>
          </div>
        )}
      </div>

      {/* MAPA */}
      {location && format !== "Online" && (
        <div className="mt-3 h-48 w-full rounded-xl overflow-hidden">
          <GoogleMapEmbed location={location} />
        </div>
      )}

      {/* ACTIONS – OVDJE SE KORISTI lesson_id */}
      <div className="mt-4 flex items-center gap-3">
        {reserved && (
          <span className="font-semibold text-[#3674B5]">
            Rezervirano
          </span>
        )}

        {canReserve && !reserved && (
          <button
            onClick={() => onReserve(termin.lesson_id)}
            className="px-4 py-2 bg-[#3674B5] text-white rounded-xl"
          >
            Rezerviraj
          </button>
        )}

        {role !== "student" && (
          <button
            onClick={onClick}
            className="px-4 py-2 bg-[#3674B5] text-white rounded-xl"
          >
            Detalji termina
          </button>
        )}
      </div>
    </article>

    {/* MODAL: INSTRUKTOR */}
    {showInstructor && (
      <div
        className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
        onClick={() => setShowInstructor(false)}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-6xl max-h-[85vh] overflow-y-auto"
        >
          {loadingInstructor ? (
            <div className="bg-[#3674B5] p-6 rounded-xl"><LogoBulbProgress/></div>
          ) : (
            <InstructorCard
              user={instructorProfile}
              onClose={() => setShowInstructor(false)}
            />
          )}
        </div>
      </div>
    )}
  </>
);


}