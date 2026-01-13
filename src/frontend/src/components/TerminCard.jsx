import React, { useState } from "react";
import { MapPin, Trash2 } from "lucide-react";
import InstructorCard from "./InstructorCard";
import api from "../api";
import GoogleMapEmbed from "./GoogleMapEmbed";
import LogoBulbProgress from "./LogoBulbProgress";
import { useNavigate } from "react-router-dom";

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
  onReserveOrCancel,
  role,
  canReserve,
  reserved,
  onTerminDelete,
}) {
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
    subject,
  } = termin || {};

  const navigate = useNavigate();

  const goToMeeting = () => {
    navigate(`/lesson/${lesson_id}/call`);
  };

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
    } finally {
      setLoadingInstructor(false);
    }
  };

  const toggleInstructor = () => {
    if (!showInstructor && instructor_id) {
      fetchInstructorData(instructor_id);
    }
    setShowInstructor((v) => !v);
  };

  const expired = new Date(`${date}T${time}`) < new Date();

  return (
    <>
      <article
        className={`group rounded-2xl bg-[#D1F8EF] border border-white/60 p-4 text-[#3674B5] max-w-xxl shadow-lg hover:scale-[1.01] duration-[350ms] ease-in-out`}
      >
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

          <div className="bg-white rounded-xl px-3 py-3 text-lg font-bold ring-1">
            {price != null && duration_min
              ? `${(price * duration_min) / 60} €`
              : "—"}
          </div>
        </div>

        {/* TAGOVI */}
        <div className="mt-5 flex flex-wrap gap-2 text-lg justify-start">
          <span className="px-5 py-3 rounded-full bg-white/70 ring-1 lowercase first-letter:uppercase">
            {level ?? "Razina"}
          </span>
          <span className="px-5 py-3 rounded-full bg-white/70 ring-1">
            {subject ?? "Predmet"}
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
        <div className="mt-5 text-xl underline underline-offset-2 font-bold">
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
          <div className="mt-5 h-48 w-full rounded-xl overflow-hidden ring-1">
            <GoogleMapEmbed location={location} />
          </div>
        )}

        {/* ACTIONS */}
        {role === "student" &&
          ((reserved && format === "Online") || !expired) && (
            <div className="mt-5 flex items-center gap-3">
              {reserved && !expired && (
                <button
                  onClick={() => onReserveOrCancel(lesson_id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-800 duration-[350ms] ease-in-out ring-1"
                >
                  Otkaži
                </button>
              )}

              {canReserve && !reserved && !expired && (
                <button
                  onClick={() => onReserveOrCancel(lesson_id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-800 duration-[350ms] ease-in-out ring-1"
                >
                  Rezerviraj
                </button>
              )}

              {/* Premješteno unutar istog flex div-a */}
              {reserved && format === "Online" && (
                <button
                  onClick={goToMeeting}
                  className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-800 duration-[350ms] ease-in-out ring-1"
                >
                  Uđi u meeting
                </button>
              )}
            </div>
          )}

        {role === "instructor" && format === "Online" && (
          <button
            onClick={goToMeeting}
            className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-800 duration-[350ms] ease-in-out ring-1 mt-5"
          >
            Pokreni meeting
          </button>
        )}

        {/* DELETE IKONA ZA INSTRUKTORA */}
        {role === "instructor" && (
          <button
            onClick={() => onTerminDelete(lesson_id)}
            className="px-3 py-3 absolute bottom-3 right-5 text-red-600 hover:bg-red-200 rounded-full 
            transition-all duration-[350ms] ease-in-out opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="w-7 h-7" />
          </button>
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
