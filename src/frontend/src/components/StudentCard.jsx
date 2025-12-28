import React from "react";
import { Star } from "lucide-react";
import { Link } from "react-router-dom";
import defaultAvatar from "../images/avatar.jpg";

function getFullName(user) {
  return (
    user?.full_name ||
    `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() ||
    "Učenik"
  );
}

export default function StudentCard({
  user,
  onClose,
  // 👇 defaultno sada PRIKAZUJEMO gumb Uredi i vodimo na /profile/student/edit
  canEdit = true,
  editTo = "/profile/student/edit",
}) {
  const fullName = getFullName(user);

  const bio =
    user?.bio || "Ovdje ide opis učenika, njegovih interesa i ciljeva učenja.";

  const location = user?.location || "—";

  // PREDMETI + RAZINA ZNANJA
  const subjectsRaw = user?.subjects ?? [];
  const subjects = Array.isArray(subjectsRaw)
    ? subjectsRaw
        .map((s) => {
          if (typeof s === "string") {
            return { name: s, level: null };
          }
          return {
            name: s?.name ?? "",
            level: s?.level ?? s?.knowledge_level ?? null,
          };
        })
        .filter((s) => s.name)
    : [];

  // RAZRED / SEMESTAR
  const grade =
    user?.grade ??
    user?.school_grade ??
    user?.semester ??
    user?.class_label ??
    "Nije navedeno";

  // PREFERIRANI TERMINI
  const prefRaw = user?.preferred_slots ?? user?.preferred_times ?? [];
  const preferredSlots = Array.isArray(prefRaw) ? prefRaw : [];

  const formatPrefSlot = (slot) => {
    if (typeof slot === "string") return slot;

    const day = slot?.day || slot?.date || "";
    const from = (slot?.from || slot?.start || "").slice(0, 5);
    const to = (slot?.to || slot?.end || "").slice(0, 5);
    const part = slot?.part_of_day || "";

    if (day && from && to) return `${day} ${from}–${to}`;
    if (part && day) return `${day} • ${part}`;
    if (part) return part;
    return day || "Termin";
  };

  // CILJEVI UČENJA
  const goalsRaw = user?.goals ?? user?.learning_goals ?? [];
  const goals = Array.isArray(goalsRaw) ? goalsRaw : goalsRaw ? [goalsRaw] : [];

  // OMILJENI INSTRUKTORI
  const favoritesRaw = user?.favorite_instructors ?? user?.favorites ?? [];
  const favoriteCount = Array.isArray(favoritesRaw) ? favoritesRaw.length : 0;

  // OBAVIJESTI
  const notificationsEnabled =
    user?.notifications_enabled ?? user?.notify_new_slots ?? false;

  const avatarUrl = user?.avatar || user?.profile_image || null;

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
                alt="Avatar učenika"
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
              <span className="font-bold">O učeniku: </span>
              <span className="font-normal">{bio}</span>
            </div>

            <div className="mt-2 text-[#3674B5]/90 text-base sm:text-lg">
              <span className="font-bold">Lokacija: </span>
              <span className="font-normal">{location}</span>
            </div>

            <div className="mt-2 text-[#3674B5]/90 text-base sm:text-lg">
              <span className="font-bold">Razred / semestar: </span>
              <span className="font-normal">{grade}</span>
            </div>
          </div>
        </div>

        {/* MAIN */}
        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* LEFT: predmeti + omiljeni instruktorI */}
          <div className="lg:col-span-5">
            {/* Predmeti + razina */}
            <div className="rounded-2xl bg-[#215993] p-5 text-[#D1F8EF]">
              <h2 className="text-lg sm:text-xl font-semibold">
                Predmeti i razina znanja
              </h2>

              <div className="mt-4 flex flex-wrap gap-2">
                {(subjects.length
                  ? subjects
                  : [{ name: "Nije navedeno", level: null }]
                ).map((s, i) => (
                  <span
                    key={`${s.name}-${i}`}
                    className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-sm sm:text-base"
                  >
                    {s.level ? `${s.name} • ${s.level}` : s.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Omiljeni instruktori */}
            <div className="mt-5 rounded-2xl bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-[#3674B5]">
                  <Star className="h-6 w-6 text-[#D1F8EF] fill-[#D1F8EF]" />
                </div>

                <div className="text-[#3674B5] text-3xl font-semibold">
                  {favoriteCount}
                </div>

                <div className="text-[#3674B5] text-lg sm:text-xl font-semibold">
                  Omiljenih instruktora
                </div>
              </div>

              <p className="mt-3 text-[#3674B5]/60 text-sm sm:text-base">
                Učenik može dodati instruktore na popis omiljenih radi bržeg
                pronalaska i praćenja novih termina.
              </p>
            </div>
          </div>

          {/* RIGHT: preferirani termini + ciljevi */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl bg-[#3674B5] p-5 sm:p-6 text-[#D1F8EF]">
              <div className="text-lg sm:text-xl font-semibold text-center">
                Preferirani termini
              </div>

              <div className="mt-4 rounded-xl bg-white/10 p-4">
                <div className="flex flex-wrap gap-2">
                  {preferredSlots.length ? (
                    preferredSlots.slice(0, 12).map((slot, idx) => (
                      <span
                        key={idx}
                        className="rounded-full bg-white/15 px-3 py-1 text-sm"
                      >
                        {formatPrefSlot(slot)}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-full bg-white/15 px-3 py-1 text-sm">
                      Nisu postavljeni preferirani termini
                    </span>
                  )}
                </div>

                <div className="mt-5">
                  <div className="text-base sm:text-lg font-semibold">
                    Ciljevi učenja
                  </div>
                  {goals.length ? (
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm sm:text-base">
                      {goals.slice(0, 6).map((g, i) => (
                        <li key={i}>{g}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm sm:text-base text-[#D1F8EF]/80">
                      Učenik još nije definirao ciljeve učenja.
                    </p>
                  )}
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm sm:text-base">
                    Obavijesti o novim slobodnim terminima:{" "}
                    <span className="font-semibold">
                      {notificationsEnabled ? "Uključene" : "Isključene"}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="rounded-xl bg-[#D1F8EF] px-4 py-2.5 text-sm sm:text-base text-[#3674B5] font-semibold hover:brightness-95"
                  >
                    Postavke obavijesti
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER: Uredi profil učenika */}
        {canEdit && (
          <div className="mt-6">
            <Link
              to={editTo}
              className="block w-full text-center rounded-xl bg-[#215993] px-4 py-3 text-[#D1F8EF] font-semibold hover:brightness-110"
            >
              Uredi profil
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
