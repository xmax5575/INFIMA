import React, { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import { Link } from "react-router-dom";
import defaultAvatar from "../images/avatar.jpg";
import api from "../api";
import LogoBulbLoader from "./LogoBulbProgress";

function getFullName(user) {
  return (
    `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() || "Učenik"
  );
}

const levelLabel = (lvl) => {
  if (lvl === "vrlo_dobra") return "vrlo dobra";
  return lvl ?? "";
};

export default function StudentCard({
  onClose,
  canEdit = true,
  editTo = "/profile/student/edit",
  renderData,
}) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchStudent = async () => {
      setLoading(true);
      setErrMsg("");

      try {
        const res = await api.get("/api/student/inf/");
        if (!cancelled) {
          setStudent(res.data);
        }
      } catch (e) {
        if (!cancelled) {
          setErrMsg("Ne mogu dohvatiti podatke o učeniku.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchStudent();

    return () => {
      cancelled = true;
    };
  }, [renderData]);

  const u = student;

  const fullName = useMemo(() => getFullName(u), [u]);
  const schoolLevel = u?.school_level ?? null;
  const schoolLabel =
    schoolLevel === "osnovna"
      ? "Osnovna škola"
      : schoolLevel === "srednja"
        ? "Srednja škola"
        : "";

  const grade = u?.grade ?? "—";

  const avatarUrl = u?.profile_image_url || null;

  const subjects = useMemo(() => {
    const raw = student?.knowledge_level;

    if (!raw) return [];
    if (!Array.isArray(raw) && typeof raw === "object") {
      return Object.entries(raw).map(([name, level]) => ({
        name,
        level,
      }));
    }

    if (Array.isArray(raw)) {
      return raw
        .map((s) => {
          if (typeof s === "string") return { name: s, level: null };
          return {
            name: s?.subject ?? s?.name ?? "",
            level: s?.level ?? null,
          };
        })
        .filter((s) => s.name);
    }

    return [];
  }, [student]);

  const preferredSlots = useMemo(() => {
    const raw = u?.preferred_slots ?? u?.preferred_times ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [u]);

  const formatPrefSlot = (slot) => {
    if (typeof slot === "string") return slot;

    const day = slot?.day || slot?.date || "";
    const from = (slot?.from || slot?.start || "").slice(0, 5);
    const to = (slot?.to || slot?.end || "").slice(0, 5);

    if (day && from && to) return `${day} ${from}–${to}`;
    return day || "Termin";
  };

  const goals = useMemo(() => {
    const raw = u?.goals ?? u?.learning_goals ?? "";
    if (Array.isArray(raw)) return raw.filter(Boolean);
    return raw ? [raw] : [];
  }, [u]);

  const favorites = useMemo(() => {
    const raw = u?.favorite_instructors ?? [];
    if (!Array.isArray(raw)) return [];
    return raw
      .map((x) => {
        if (typeof x === "number")
          return { id: x, full_name: `Instruktor #${x}` };
        return {
          id: x?.instructor_id ?? x?.id,
          full_name:
            `${x?.first_name ?? ""} ${x?.last_name ?? ""}`.trim() ||
            "Instruktor",
        };
      })
      .filter((x) => x.id != null);
  }, [u]);

  return (
    <div className="w-full">
      <div className="relative mx-auto w-full max-w-5xl rounded-3xl bg-[#D1F8EF] p-12 ">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-xl bg-white/70 text-2xl text-[#3674B5] hover:bg-white"
            aria-label="Zatvori"
          >
            ✕
          </button>
        )}

        {loading && (
          <div className="mb-4 rounded-xl bg-white/80 p-3 text-[#215993] font-semibold">
            <LogoBulbLoader/>
          </div>
        )}

        {errMsg && (
          <div className="mb-4 rounded-xl bg-red-100 p-3 text-red-700 font-semibold">
            {errMsg}
          </div>
        )}

        {!loading && !u ? (
          <div className="rounded-2xl bg-white/70 p-6 text-[#215993] font-semibold">
            Nema podataka o učeniku za prikaz.
          </div>
        ) : (
          <>
            {/* TOP */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
              <div className="lg:col-span-3">
                <div className="h-[180px] w-full max-w-[220px] overflow-hidden rounded-2xl bg-[#808080] sm:h-[210px]">
                  <img
                    src={avatarUrl || defaultAvatar}
                    alt="Avatar učenika"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>

              <div className="lg:col-span-9 p-2">
                <h1 className="text-[#215993] text-3xl sm:text-5xl font-semibold leading-tight">
                  {fullName}
                </h1>
                <div className="mt-6">
                  <div className="text-base sm:text-lg font-bold text-[#3674B5]/90">
                    Ciljevi učenja
                  </div>

                  {goals.length ? (
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm sm:text-base text-[#3674B5]/90">
                      {goals.slice(0, 12).map((g, i) => (
                        <li key={i}>{g}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm sm:text-base text-[#D1F8EF]/80">
                      Učenik još nije definirao ciljeve učenja.
                    </p>
                  )}
                </div>

                <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/60 px-4 py-1 text-sm font-semibold text-[#215993] border border-white/70 shadow-sm">
                  {schoolLabel && <span>{schoolLabel}</span>}
                  {schoolLabel && grade && (
                    <span className="opacity-50">•</span>
                  )}
                  {grade && <span>{grade}. razred</span>}
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-12">
              <div className="lg:col-span-5">
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
                        {s.level
                          ? `${s.name} • ${levelLabel(s.level)}`
                          : s.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 rounded-2xl bg-white p-5">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-full bg-[#3674B5]">
                      <Star className="h-6 w-6 text-[#D1F8EF] fill-[#D1F8EF]" />
                    </div>

                    <div className="text-[#3674B5] text-3xl font-semibold">
                      {favorites.length}
                    </div>

                    <div className="text-[#3674B5] text-lg sm:text-xl font-semibold">
                      Omiljenih instruktora
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {favorites.length ? (
                      favorites.map((f) => (
                        <div
                          key={f.id}
                          className="rounded-xl bg-[#D1F8EF]/50 border border-white/60 px-4 py-2 text-[#215993] font-semibold"
                        >
                          {f.full_name}
                        </div>
                      ))
                    ) : (
                      <div className="text-[#3674B5]/70">
                        Nema omiljenih instruktora.
                      </div>
                    )}
                  </div>
                </div>
              </div>

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
                            className="rounded-full bg-white/15 px-3 py-1 text-sm sm:text-base"
                          >
                            {formatPrefSlot(slot)}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-full bg-white/15 px-3 py-1 text-sm sm:text-base">
                          Nisu postavljeni preferirani termini
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {canEdit && (
              <div className="mt-6">
                <Link
                  to={editTo}
                  className="block w-full text-center rounded-xl bg-[#215993] px-4 py-3 text-[#D1F8EF] font-semibold hover:brightness-110"
                  onClick={onClose}
                >
                  Uredi profil
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
