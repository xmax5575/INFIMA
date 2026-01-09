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

export default function TerminCard({
  termin,
  onReserve,
  role,
  canReserve,
  reserved,
}) {
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
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center font-bold text-xl ring-1">
              {initials(instructor_display)}
            </div>
            <div>
              <div className="text-lg opacity-70">Instruktor</div>
              {role === "student" ? (
                <button
                  className="font-semibold text-lg"
                  onClick={toggleInstructor}
                >
                  {title}
                </button>
              ) : (
                <span className="font-semibold text-lg">{title}</span>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl px-2.5 py-2.5 text-sm font-bold ring-1">
            {price != null && duration_min
              ? `${(price * duration_min) / 60} €`
              : "—"}
          </div>
        </div>

        {/* TAGOVI */}
        <div className="mt-7 flex flex-wrap gap-2 text-lg justify-start">
          <span className="px-5 py-3 rounded-full bg-white/70 ring-1">
            {level ?? "Razina"}
          </span>
          <span className="px-5 py-3 rounded-full bg-white/70 ring-1">
            {format ?? "Format"}
          </span>
          {max_students != null && (
            <span className="px-5 py-3 rounded-full bg-white/70 ring-1">
              max {max_students}
            </span>
          )}
          <span className="px-5 py-3 rounded-full bg-white/70 ring-1">
            {duration_min} min
          </span>
        </div>

        {/* DATUM / LOKACIJA */}
        <div className="mt-7 text-xl underline underline-offset-2 font-bold">
          <div>{when}</div>

          {location && format !== "Online" && (
            <div className="flex items-center gap-2 mt-1">
              <MapPin className="w-7 h-7" />
              <span>{location}</span>
            </div>
          )}
        </div>

        {/* MAPA */}
        {location && format !== "Online" && (
          <div className="mt-7 h-48 w-full rounded-xl overflow-hidden ring-1">
            <GoogleMapEmbed location={location} />
          </div>
        )}

        {/* ACTIONS – OVDJE SE KORISTI lesson_id */}
        {role === "student" && (
          <div className="mt-4 flex items-center gap-3">
            {reserved && (
              <button
                onClick={() => onReserve(termin.lesson_id)}
                className="px-4 py-2 bg-[#DC2626] text-white rounded-xl hover:bg-[#B91C1C] hover:scale-105 duration-[500ms] ease-in-out"
              >
                Otkaži
              </button>
            )}

            {canReserve && !reserved && (
              <button
                onClick={() => onReserve(termin.lesson_id)}
                className="px-4 py-2 bg-[#3674B5] text-white rounded-xl hover:bg-[#1E3A8A] hover:scale-105 duration-[500ms] ease-in-out"
              >
                Rezerviraj
              </button>
            )}
          </div>
        )}
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
              <div className="bg-[#3674B5] p-6 rounded-xl">
                <LogoBulbProgress />
              </div>
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
