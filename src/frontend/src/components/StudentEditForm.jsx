import Header from "../components/Header";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import defaultAvatar from "../images/avatar.jpg";
import { Heart } from "lucide-react";
import InstructorCard from "../components/InstructorCard";
import { supabase } from "../supabaseClient";

// Dani
const DAYS = [
  "Ponedjeljak",
  "Utorak",
  "Srijeda",
  "Četvrtak",
  "Petak",
  "Subota",
  "Nedjelja",
];

// Sati 08–21
const HOURS = Array.from({ length: 14 }, (_, i) =>
  String(8 + i).padStart(2, "0")
);
const MINUTES = ["00", "15", "30", "45"];

const SUBJECTS = ["Matematika", "Fizika", "Informatika"];
const LEVELS = ["loša", "dovoljna", "dobra", "vrlo dobra", "odlična"];
const DEFAULT_SLOT = { day: "Ponedjeljak", from: "08:00", to: "09:00" };

// "HH:MM" -> minute
const toMinutes = (t) => {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};

function parsePreferredRange(str) {
  // očekujemo: "Ponedjeljak 18:00-19:30"
  if (typeof str !== "string") return null;

  const match = str.match(/^(\S+)\s+(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/);
  if (!match) return null;

  return {
    day: match[1],
    from: match[2].padStart(5, "0"),
    to: match[3].padStart(5, "0"),
  };
}

async function uploadStudentAvatar(file) {
  const ext = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const path = `students/pictures/${fileName}`;


  const { error } = await supabase.storage.from("media").upload(path, file);

  if (error) throw error;

  const { data } = supabase.storage.from("media").getPublicUrl(path);

  return data.publicUrl;
}

export default function StudentEditPage({update}) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // instruktori + favorites
  const [instructors, setInstructors] = useState([]);
  const [instructorsLoading, setInstructorsLoading] = useState(false);
  const [instructorsError, setInstructorsError] = useState("");
  const [favoriteIds, setFavoriteIds] = useState([]);

  // modal
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [isInstructorModalOpen, setIsInstructorModalOpen] = useState(false);
  const [instructorDetailLoading, setInstructorDetailLoading] = useState(false);
  const [instructorDetailError, setInstructorDetailError] = useState("");

  // notifikacije
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Osnovna / Srednja -> razredi
  const [schoolLevel, setSchoolLevel] = useState(""); // "osnovna" | "srednja"
  const gradeOptions = useMemo(() => {
    if (schoolLevel === "osnovna")
      return Array.from({ length: 8 }, (_, i) => String(i + 1));
    if (schoolLevel === "srednja")
      return Array.from({ length: 4 }, (_, i) => String(i + 1));
    return [];
  }, [schoolLevel]);

  const [formData, setFormData] = useState({
    full_name: "",
    grade: "",
    learning_goals: "",
  });

  // subjects -> map: { Matematika: "dobra", Fizika: "..." ... }
  const [subjectLevels, setSubjectLevels] = useState(() => ({
    Matematika: "",
    Fizika: "",
    Informatika: "",
  }));

  // termini: [{ day, from:"HH:MM", to:"HH:MM" }]
  const [timeSlots, setTimeSlots] = useState([DEFAULT_SLOT]);
  // ---------- modal helpers ----------
  const closeInstructorModal = () => {
    setIsInstructorModalOpen(false);
    setSelectedInstructor(null);
    setInstructorDetailLoading(false);
    setInstructorDetailError("");
  };
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);

  const openInstructorModal = async (ins) => {
    const id = ins?.id;
    if (!id) return;

    setIsInstructorModalOpen(true);
    setInstructorDetailLoading(true);
    setInstructorDetailError("");

    // pokaži odmah osnovne podatke iz liste
    setSelectedInstructor(ins);

    // fallback endpointi (da preživi 404)
    const urls = [
      `/api/instructor/${id}/`,
      `/api/instructors/${id}/`,
      `/api/instructors/detail/${id}/`,
    ];

    try {
      let ok = false;

      for (const url of urls) {
        try {
          const res = await api.get(url);
          setSelectedInstructor(res.data);
          ok = true;
          break;
        } catch (e) {
          if (e?.response?.status !== 404) throw e;
        }
      }

      if (!ok) {
        setInstructorDetailError(
          "Ne mogu dohvatiti detalje instruktora (endpoint 404)."
        );
      }
    } catch (err) {
      setInstructorDetailError("Ne mogu dohvatiti detalje instruktora.");
    } finally {
      setInstructorDetailLoading(false);
    }
  };

  // ESC zatvara modal
  useEffect(() => {
    if (!isInstructorModalOpen) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") closeInstructorModal();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInstructorModalOpen]);

  // block scroll dok je modal otvoren
  useEffect(() => {
    document.body.style.overflow = isInstructorModalOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isInstructorModalOpen]);

  // toggle favorite (srce)
  const toggleFavorite = (id) => {
    setFavoriteIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // ---------- load profile ----------
  // ---------- load profile ----------
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // ✅ koristi student endpoint
        const res = await api.get("/api/student/inf/");
        const data = res.data || {};
        // ✅ full_name složimo iz first/last (jer student serializer vraća first_name/last_name)
        const full_name =
          data.full_name ||
          `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim();

        setFormData({
          full_name: full_name || "",
          grade: data.grade != null ? String(data.grade) : "",
          learning_goals: data.learning_goals || "",

        });

        // ✅ ako ti backend još nema school_level, ostavi ovo - neće smetati
        if (
          data.school_level === "osnovna" ||
          data.school_level === "srednja"
        ) {
          setSchoolLevel(data.school_level);
        }
        // 👇 AKO backend vraća profile_image_url
        if (data.profile_image_url) {
          setAvatarPreview(data.profile_image_url);
        }

        // ✅ notifikacije
        setNotificationsEnabled(
          data.notifications_enabled ?? data.notify_new_slots ?? false
        );

        // ✅ preferred_times: podrži i objekt i string format
        const fromApi = Array.isArray(data.preferred_times)
          ? data.preferred_times
          : [];

        const parsedSlots = fromApi
          .map((x) => {
            // novi format: {day, start, end}
            if (x && typeof x === "object") {
              const day = x.day;
              const from = x.start;
              const to = x.end;
              if (!day || !from || !to) return null;
              return {
                day,
                from: String(from).slice(0, 5),
                to: String(to).slice(0, 5),
              };
            }

            // stari format: "Ponedjeljak 18:00-19:30"
            if (typeof x === "string") return parsePreferredRange(x);

            return null;
          })
          .filter(Boolean);

        setTimeSlots(parsedSlots.length ? parsedSlots : [DEFAULT_SLOT]);

        const rawKL = data.knowledge_level ?? {};

        const nextMap = {
          Matematika: "",
          Fizika: "",
          Informatika: "",
        };

        if (rawKL && typeof rawKL === "object" && !Array.isArray(rawKL)) {
          Object.entries(rawKL).forEach(([subject, level]) => {
            if (subject in nextMap) {
              nextMap[subject] = level ?? "";
            }
          });
        } else {
          rawKL.forEach((item) => {
            if (item.subject in nextMap) {
              nextMap[item.subject] = item.level || "";
            }
          });
        }
        setSubjectLevels(nextMap);

        // ✅ favorite_instructors: [{instructor_id, first_name, last_name}]
        const favRaw =
          data.favorite_instructors ??
          data.favorites ??
          data.favorite_instructor_ids ??
          [];

        const favIds = Array.isArray(favRaw)
          ? favRaw
              .map((x) => {
                if (typeof x === "number") return x;
                // backend ti vraća instructor_id
                return x?.instructor_id ?? x?.id;
              })
              .filter((n) => typeof n === "number")
          : [];

        setFavoriteIds(favIds);
      } catch (err) {}
    };

    fetchProfile();
    // 2️⃣ svaki put kad se vratiš na stranicu
  
  }, [update]);

  // load instructors
  useEffect(() => {
    const fetchInstructors = async () => {
      setInstructorsLoading(true);
      setInstructorsError("");
      try {
        // ako ti je endpoint točan, ostavi ovako
        const res = await api.get("/api/instructors/all/");

        const list = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.results)
          ? res.data.results
          : [];

        setInstructors(list);
      } catch (err) {
        setInstructorsError("Ne mogu dohvatiti instruktore.");
      } finally {
        setInstructorsLoading(false);
      }
    };

    fetchInstructors();
  }, []);

  // kad se promijeni schoolLevel, očisti grade ako više nije validan
  useEffect(() => {
    if (!schoolLevel) return;
    if (!formData.grade) return;

    const ok = gradeOptions.includes(String(formData.grade));
    if (!ok) setFormData((p) => ({ ...p, grade: "" }));
  }, [schoolLevel, gradeOptions, formData.grade]);

  // ---------- slot handlers ----------
  const handleSlotChange = (index, field, value) => {
    setTimeSlots((prev) =>
      prev.map((slot, i) => (i === index ? { ...slot, [field]: value } : slot))
    );
  };

  const handleTimePartChange = (index, field, part, value) => {
    setTimeSlots((prev) =>
      prev.map((slot, i) => {
        if (i !== index) return slot;

        const current = slot[field] || "08:00";
        const [h = "08", m = "00"] = current.split(":");
        const nextH = part === "hour" ? value : h;
        const nextM = part === "minute" ? value : m;

        return { ...slot, [field]: `${nextH}:${nextM}` };
      })
    );
  };

  const handleAddSlot = () =>
    setTimeSlots((prev) => [...prev, { ...DEFAULT_SLOT }]);
  const handleRemoveSlot = (index) =>
    setTimeSlots((prev) => prev.filter((_, i) => i !== index));

  const inputStyle =
    "w-full p-2.5 rounded-xl border-none bg-white/80 focus:bg-white focus:outline-none text-[#215993] placeholder-[#3674B5]/40 transition-all";
  const labelStyle = "block text-[13px] font-bold text-[#3674B5] mb-1.5 ml-1";

  // ---------- submit ----------
  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let profileImageUrl = null;

      if (avatarFile) {
        profileImageUrl = await uploadStudentAvatar(avatarFile);
      }

      const preferred_times = timeSlots
        .filter((s) => s.day && s.from && s.to)
        .filter((s) => {
          const a = toMinutes(s.from);
          const b = toMinutes(s.to);
          return a != null && b != null && b > a;
        })
        .map((s) => ({
          day: s.day,
          start: s.from,
          end: s.to,
        }));

      const knowledge_level = SUBJECTS.map((subject) => ({
        subject,
        level: subjectLevels[subject] || null,
      })).filter((x) => x.level);

      await api.post("/api/student/me/", {
        school_level: schoolLevel || null,
        grade: Number(formData.grade) || null,
        learning_goals: formData.learning_goals,
        preferred_times,
        knowledge_level,
        notifications_enabled: notificationsEnabled,
        favorite_instructors: favoriteIds,
        ...(profileImageUrl && { profile_image_url: profileImageUrl }),
      });

      if (
        schoolLevel &&
        formData.grade &&
        formData.learning_goals &&
        knowledge_level.Matematika !== "" &&
        knowledge_level.Fizika !== "" &&
        knowledge_level.Informatika !== "" &&
        preferred_times.length > 0
      ) {
        localStorage.setItem("profile_saved_student", "1");
        window.dispatchEvent(
          new CustomEvent("profileUpdated", {
            detail: { role: "student", isProfileComplete: true },
          })
        );
      }

      navigate("/home/student");
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />

      <div className="w-full max-w-4xl rounded-[32px] bg-[#D1F8EF] p-8 shadow-xl border border-white/20">
        <form onSubmit={onSubmit} className="p-6">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Avatar / škola ispod */}
            <div className="w-full md:w-1/3 flex flex-col items-center">
              <label htmlFor="avatarUpload" className="cursor-pointer">
                <div className="relative group w-56 h-56 bg-[#A8A8A8] rounded-3xl overflow-hidden border-4 border-white/50">
                  <img
                    src={avatarPreview || defaultAvatar}
                    alt="Avatar"
                    className="w-56 h-56 rounded-3xl object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-[500ms] bg-black/60">
                    <span className="text-[#E8FCF7] font-bold text-lg text-center uppercase">
                      {avatarPreview ? "Promijeni sliku" : "Klik za upload"}
                    </span>
                  </div>
                </div>
              </label>

              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="avatarUpload"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (!file) return;

                  setAvatarFile(file); // 👈 ovo ide backendu
                  setAvatarPreview(URL.createObjectURL(file)); // 👈 ovo je za UI
                }}
              />

              {/* Škola + Razred kartica */}
              <div className="w-full max-w-[224px] mt-6 rounded-2xl bg-white/50 border border-white/60 p-4 shadow-sm">
                <div className="space-y-4">
                  <div>
                    <label className={labelStyle}>Škola:</label>
                    <select
                      className={inputStyle}
                      value={schoolLevel}
                      onChange={(e) => setSchoolLevel(e.target.value)}
                      required
                    >
                      <option value="">Odaberi</option>
                      <option value="osnovna">Osnovna škola</option>
                      <option value="srednja">Srednja škola</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelStyle}>Razred:</label>
                    <select
                      className={inputStyle}
                      value={formData.grade}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, grade: e.target.value }))
                      }
                      disabled={!schoolLevel}
                      required
                    >
                      <option value="">
                        {schoolLevel ? "Odaberi razred" : "Prvo odaberi školu"}
                      </option>
                      {gradeOptions.map((g) => (
                        <option key={g} value={g}>
                          {g}.
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Desno: podaci */}
            <div className="flex-1 space-y-5">
              <h2 className="mt-4 text-4xl font-bold text-[#215993]">
                {formData.full_name || "Student"}
              </h2>

              {/* Predmeti + razina */}
              <div>
                <label className={labelStyle}>Predmeti i razina znanja:</label>

                <div className="space-y-2">
                  {SUBJECTS.map((subj) => (
                    <div
                      key={subj}
                      className="flex flex-col sm:flex-row gap-2 sm:items-center"
                    >
                      <div className="text-[#215993] font-semibold sm:w-40">
                        {subj}
                      </div>

                      <select
                        className={`${inputStyle} sm:flex-1`}
                        value={subjectLevels[subj]}
                        onChange={(e) =>
                          setSubjectLevels((p) => ({
                            ...p,
                            [subj]: e.target.value,
                          }))
                        }
                        required
                      >
                        <option value="">Odaberi razinu</option>
                        {LEVELS.map((lvl) => (
                          <option key={lvl} value={lvl}>
                            {lvl}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preferirani termini od-do */}
              <div>
                <label className={labelStyle}>
                  Preferirani termini (od–do):
                </label>

                <div className="space-y-3">
                  {timeSlots.map((slot, index) => {
                    const [fromH = "08", fromM = "00"] = (
                      slot.from || ""
                    ).split(":");
                    const [toH = "09", toM = "00"] = (slot.to || "").split(":");

                    const validRange =
                      slot.from && slot.to
                        ? toMinutes(slot.to) > toMinutes(slot.from)
                        : true;

                    return (
                      <div key={index} className="flex flex-col gap-2">
                        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                          {/* Dan */}
                          <select
                            className={`${inputStyle} sm:w-32`}
                            value={slot.day}
                            onChange={(e) =>
                              handleSlotChange(index, "day", e.target.value)
                            }
                            required
                          >
                            {DAYS.map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>

                          {/* OD */}
                          <div className="flex items-center gap-2">
                            <span className="text-[#215993] font-semibold">
                              Od
                            </span>

                            <select
                              className={`${inputStyle} w-24`}
                              value={fromH || "08"}
                              onChange={(e) =>
                                handleTimePartChange(
                                  index,
                                  "from",
                                  "hour",
                                  e.target.value
                                )
                              }
                            >
                              {HOURS.map((h) => (
                                <option key={h} value={h}>
                                  {h}
                                </option>
                              ))}
                            </select>

                            <select
                              className={`${inputStyle} w-20`}
                              value={fromM || "00"}
                              onChange={(e) =>
                                handleTimePartChange(
                                  index,
                                  "from",
                                  "minute",
                                  e.target.value
                                )
                              }
                            >
                              {MINUTES.map((m) => (
                                <option key={m} value={m}>
                                  {m}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* DO */}
                          <div className="flex items-center gap-2">
                            <span className="text-[#215993] font-semibold">
                              Do
                            </span>

                            <select
                              className={`${inputStyle} w-24`}
                              value={toH || "09"}
                              onChange={(e) =>
                                handleTimePartChange(
                                  index,
                                  "to",
                                  "hour",
                                  e.target.value
                                )
                              }
                            >
                              {HOURS.map((h) => (
                                <option key={h} value={h}>
                                  {h}
                                </option>
                              ))}
                            </select>

                            <select
                              className={`${inputStyle} w-20`}
                              value={toM || "00"}
                              onChange={(e) =>
                                handleTimePartChange(
                                  index,
                                  "to",
                                  "minute",
                                  e.target.value
                                )
                              }
                            >
                              {MINUTES.map((m) => (
                                <option key={m} value={m}>
                                  {m}
                                </option>
                              ))}
                            </select>
                          </div>

                          {timeSlots.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSlot(index)}
                              className="text-xs font-semibold text-red-600 hover:text-red-700 ml-1"
                            >
                              Ukloni
                            </button>
                          )}
                        </div>

                        {!validRange && (
                          <div className="text-xs text-red-600 font-semibold">
                            "Do" mora biti nakon "Od".
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    onClick={handleAddSlot}
                    className="text-xs font-semibold text-[#215993] hover:text-[#163a63]"
                  >
                    + Dodaj još termin
                  </button>
                </div>
              </div>

              {/* Notifikacije toggle */}
              <div className="rounded-2xl bg-white/50 border border-white/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[#215993] font-semibold">
                      Obavijesti
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setNotificationsEnabled((p) => !p)}
                    className={
                      "relative h-10 w-28 rounded-full border transition shadow-sm " +
                      (notificationsEnabled
                        ? "bg-[#215993] border-white/30"
                        : "bg-white/70 border-white/60")
                    }
                    aria-pressed={notificationsEnabled}
                    aria-label="Uključi/Isključi obavijesti"
                  >
                    {/* Klizač (thumb) */}
                    <span
                      className={
                        "absolute top-1 h-8 w-14 rounded-full grid place-items-center font-extrabold text-xs tracking-wider transition-all shadow " +
                        (notificationsEnabled
                          ? "left-14 bg-[#D1F8EF] text-[#215993]"
                          : "left-1 bg-[#215993] text-[#D1F8EF]")
                      }
                    >
                      {notificationsEnabled ? "ON" : "OFF"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Donji dio */}
          <div className="mt-8 space-y-4">
            {/* Ciljevi učenja - full width */}
            <div className="bg-[#215993] rounded-2xl p-6 border border-white/10">
              <label className="block text-[13px] font-bold text-[#D1F8EF] mb-2 uppercase tracking-wider">
                Ciljevi učenja
              </label>
              <textarea
                className="w-full h-28 p-3 rounded-xl bg-[#D1F8EF]/10 border border-white/20 text-[#D1F8EF]
                           placeholder-[#D1F8EF]/40 focus:outline-none focus:bg-[#D1F8EF]/20 transition-all
                           resize-none shadow-inner"
                value={formData.learning_goals}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, learning_goals: e.target.value }))
                }
                placeholder="Što želite postići?"
                required
              />
            </div>

            {/* Omiljeni instruktori */}
            <div className="bg-[#215993] rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between gap-3">
                <label className="block text-[13px] font-bold text-[#D1F8EF] uppercase tracking-wider">
                  Omiljeni instruktori
                </label>
                <div className="text-sm text-[#D1F8EF]/80">
                  Odabrano:{" "}
                  <span className="font-semibold">{favoriteIds.length}</span>
                </div>
              </div>

              {instructorsLoading && (
                <p className="mt-3 text-sm text-[#D1F8EF]/80">
                  Učitavanje instruktora...
                </p>
              )}

              {instructorsError && (
                <p className="mt-3 text-sm text-red-200">{instructorsError}</p>
              )}

              {!instructorsLoading && !instructorsError && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {instructors.length ? (
                    instructors.map((ins) => {
                      const id = ins?.id;
                      const name =
                        ins?.full_name ??
                        `${ins?.first_name ?? ""} ${
                          ins?.last_name ?? ""
                        }`.trim() ??
                        "Instruktor";

                      const active = id != null && favoriteIds.includes(id);

                      return (
                        <div
                          key={id ?? name}
                          className={
                            "flex items-center justify-between gap-3 rounded-2xl px-4 py-3 border transition " +
                            (active
                              ? "bg-white/20 border-white/40 ring-1 ring-[#D1F8EF]"
                              : "bg-white/10 border-white/20 hover:bg-white/15")
                          }
                        >
                          {/* Ime = modal */}
                          <button
                            type="button"
                            onClick={() => openInstructorModal(ins)}
                            className="text-left flex-1 text-[#D1F8EF] font-semibold"
                          >
                            {name}
                          </button>

                          {/* Srce = favorite */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (id != null) toggleFavorite(id);
                            }}
                            className="shrink-0 grid h-10 w-10 place-items-center rounded-xl bg-white/10 hover:bg-white/15"
                            aria-label={
                              active ? "Makni iz omiljenih" : "Dodaj u omiljene"
                            }
                            title={
                              active ? "Makni iz omiljenih" : "Dodaj u omiljene"
                            }
                          >
                            <Heart
                              className={
                                "h-6 w-6 " +
                                (active
                                  ? "text-red-300 fill-red-300"
                                  : "text-[#D1F8EF]")
                              }
                            />
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-[#D1F8EF]/80">
                      Nema instruktora za prikaz.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Gumbi */}
            <div className="bg-[#3674B5] rounded-2xl p-6 border border-white/10 flex flex-col gap-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#D1F8EF] text-[#215993] font-bold rounded-xl hover:bg:white transition-all shadow-md active:scale-[0.98]"
              >
                {loading ? "Spremanje..." : "Spremi promjene"}
              </button>

              <button
                type="button"
                onClick={() => navigate(-1)}
                className="w-full py-3 bg-[#215993] text-[#D1F8EF] font-bold rounded-xl hover:bg-[#1a4a7a] transition-all border border-white/10"
              >
                Odustani
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Modal */}
      {isInstructorModalOpen && selectedInstructor && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 sm:p-6 overflow-auto"
          onClick={closeInstructorModal}
        >
          <div
            className="w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            {instructorDetailLoading && (
              <div className="mb-3 rounded-xl bg-white/80 p-3 text-[#215993] font-semibold">
                Učitavam profil instruktora...
              </div>
            )}

            {instructorDetailError && (
              <div className="mb-3 rounded-xl bg-red-100 p-3 text-red-700 font-semibold">
                {instructorDetailError}
              </div>
            )}

            <InstructorCard
              user={selectedInstructor}
              onClose={closeInstructorModal}
              canEdit={false}
            />
          </div>
        </div>
      )}
    </>
  );
}
