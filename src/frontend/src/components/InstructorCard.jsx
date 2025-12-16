import React from "react";
import { Star } from "lucide-react";
import { Link } from "react-router-dom";
import defaultAvatar from "../images/avatar.jpg";

function getFullName(user) {
  return (
    user?.full_name ||
    `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() ||
    "Instruktor"
  );
}

export default function InstructorCard({ user, onClose, canEdit = false, editTo = "/edit" }) {
  const fullName = getFullName(user);

  const bio = user?.bio || "Ovdje ide biografija instruktora.";
  const location = user?.location || "—";

  // subjects dolaze kao objekti -> pretvori u array stringova (name)
  const subjectsRaw = user?.subjects ?? [];
  const subjects = Array.isArray(subjectsRaw)
    ? subjectsRaw.map((s) => (typeof s === "string" ? s : s?.name)).filter(Boolean)
    : [];

  const ratingRaw = user?.rating ?? user?.avg_rating ?? "—";
  const rating = String(ratingRaw).replace(".", ",");

  // cijena kod tebe: price_eur
  const priceLabel =
    user?.price_label ?? (user?.price_eur != null ? `${user.price_eur}€` : "—");

  const avatarUrl = user?.avatar || user?.profile_image || null;

  // calendar/lessons
  const lessons = Array.isArray(user?.calendar) ? user.calendar : [];

  const formatSlot = (slot) => {
    const t = (slot.time || "").slice(0, 5); // "12:10:00" -> "12:10"
    const d = slot.date || "";
    const place =
      slot.format === "Online"
        ? "Online"
        : slot.location?.trim()
        ? slot.location
        : "Uživo";

    return `${d} ${t} • ${place}`;
  };

  return (
    <div className="w-full">
      <div className="relative mx-auto w-full max-w-5xl rounded-3xl bg-[#D1F8EF] p-5 sm:p-7">
        {/* Close */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-xl bg-white/70 text-2xl text-[#3674B5] hover:bg-white"
            aria-label="Zatvori"
          >
            ✕
          </button>
        )}

        {/* TOP */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Avatar */}
          <div className="lg:col-span-3">
            <div className="h-[180px] w-full max-w-[220px] overflow-hidden rounded-2xl bg-[#808080] sm:h-[210px]">
              <img
                src={avatarUrl || defaultAvatar}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          {/* Text */}
          <div className="lg:col-span-9">
            <h1 className="text-[#215993] text-3xl sm:text-5xl font-semibold leading-tight">
              {fullName}
            </h1>

            <div className="mt-3 text-[#3674B5] text-base sm:text-lg leading-snug">
              <span className="font-bold">Biografija: </span>
              <span className="font-normal">{bio}</span>
            </div>

            <div className="mt-2 text-[#3674B5]/90 text-base sm:text-lg">
              <span className="font-bold">Lokacija: </span>
              <span className="font-normal">{location}</span>
            </div>
          </div>
        </div>

        {/* MAIN */}
        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* LEFT */}
          <div className="lg:col-span-5">
            {/* Područja + cijena */}
            <div className="relative rounded-2xl bg-[#215993] p-5 text-[#D1F8EF]">
              <div className="absolute right-4 top-4 rounded-full bg-[#3674B5] px-4 py-2 text-lg font-semibold">
                {priceLabel}
              </div>

              <h2 className="text-lg sm:text-xl font-semibold">Područja</h2>

              <div className="mt-4 flex flex-wrap gap-2 pr-[88px]">
                {(subjects.length ? subjects : ["—"]).slice(0, 8).map((s, i) => (
                  <span
                    key={`${s}-${i}`}
                    className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-sm sm:text-base"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Recenzije */}
            <div className="mt-5 rounded-2xl bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-[#3674B5]">
                  <Star className="h-6 w-6 text-[#D1F8EF] fill-[#D1F8EF]" />
                </div>

                <div className="text-[#3674B5] text-3xl font-semibold">
                  {rating}
                </div>

                <div className="text-[#3674B5] text-lg sm:text-xl font-semibold">
                  Recenzije
                </div>
              </div>

              <p className="mt-3 text-[#3674B5]/60 text-sm sm:text-base">
                (Kasnije će ovdje biti popis korisničkih recenzija)
              </p>
            </div>
          </div>

          {/* RIGHT: Kalendar */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl bg-[#3674B5] p-5 sm:p-6 text-[#D1F8EF]">
              <div className="text-lg sm:text-xl font-semibold text-center">
                Kalendar
              </div>

              <div className="mt-4 rounded-xl bg-white/10 p-4">
                <div className="mt-3 flex flex-wrap gap-2">
                  {lessons.length ? (
                    lessons.slice(0, 10).map((slot) => (
                      <span
                        key={slot.lesson_id}
                        className="rounded-full bg-white/15 px-3 py-1 text-sm"
                        title={`${slot.date} ${slot.time} | ${slot.format}${
                          slot.location ? ` | ${slot.location}` : ""
                        }`}
                      >
                        {formatSlot(slot)}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-full bg-white/15 px-3 py-1 text-sm">
                      Nema termina
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  className="mt-4 w-full rounded-xl bg-[#D1F8EF] px-4 py-2.5 text-[#3674B5] font-semibold hover:brightness-95"
                >
                  Odaberi termin
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER: Uredi */}
        {canEdit && (
          <div className="mt-6">
            <Link
              to={editTo}
              className="block w-full text-center rounded-xl bg-[#215993] px-4 py-3 text-[#D1F8EF] font-semibold hover:brightness-110"
            >
              Uredi
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
