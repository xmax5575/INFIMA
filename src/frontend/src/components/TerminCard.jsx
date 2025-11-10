// src/components/TerminCard.jsx
import React from "react";

function initials(name) {
  if (!name) return "IN";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
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

export default function TerminCard({ termin, onClick }) {
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

  const title =
    instructor_display ??
    (instructor_id != null ? `Instruktor #${instructor_id}` : "Nepoznat instruktor");

  const when = (date || time)
    ? `${formatDate(date)}${date && time ? " • " : ""}${formatTime(time)}`
    : "Datum i vrijeme nisu definirani";

  return (
    <article
      onClick={onClick}
      className="
        group rounded-2xl border border-white/60 bg-[#D1F8EF] text-[#3674B5]
        shadow-sm hover:shadow-md transition p-4 md:p-5 max-w-xl select-none
        hover:-translate-y-[1px] cursor-default
      "
    >
      {/* Header: avatar + ime + cijena */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="
              w-10 h-10 rounded-full bg-white/80 border border-white/70
              flex items-center justify-center text-sm font-bold
            "
            title={title}
          >
            {initials(instructor_display)}
          </div>
          <div className="min-w-0">
            <div className="text-xs opacity-80">Instruktor</div>
            <div className="font-semibold truncate" title={title}>
              {title}
            </div>
          </div>
        </div>

        <div
          className="
            shrink-0 rounded-xl bg-white/90 border border-white/70 px-3 py-1
            text-sm font-bold"
        >
          {price != null ? `${price} €` : "—"}
        </div>
      </div>

      {/* Sredina: bedževi */}
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

      {/* Donji dio: kada i gdje */}
      <div className="mt-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#3674B5]" />
          <span className="opacity-90">{when}</span>
        </div>

        {location ? (
          <div className="mt-1 opacity-90">{location}</div>
        ) : null}
      </div>

      {/* CTA (opcionalno) */}
      {onClick && (
        <div className="mt-4">
          <button
            className="
              rounded-xl bg-[#3674B5] text-white text-sm font-medium
              px-3 py-2 hover:opacity-90 transition
            "
            onClick={onClick}
          >
            Detalji termina
          </button>
        </div>
      )}
    </article>
  );
}
