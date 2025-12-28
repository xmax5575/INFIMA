import Header from "../components/Header";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import defaultAvatar from "../images/avatar.jpg";

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
const HOURS = Array.from({ length: 14 }, (_, i) => String(8 + i).padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];

const SUBJECTS = ["Matematika", "Fizika", "Informatika"];
const LEVELS = ["loša", "dovoljna", "dobra", "vrlo dobra", "odlična"];

// "HH:MM"
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

  return { day: match[1], from: match[2].padStart(5, "0"), to: match[3].padStart(5, "0") };
}

export default function StudentEditPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Osnovna / Srednja -> određuje razrede
  const [schoolType, setSchoolType] = useState(""); // "osnovna" | "srednja"
  const gradeOptions = useMemo(() => {
    if (schoolType === "osnovna") return Array.from({ length: 8 }, (_, i) => String(i + 1));
    if (schoolType === "srednja") return Array.from({ length: 4 }, (_, i) => String(i + 1));
    return [];
  }, [schoolType]);

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
  const [timeSlots, setTimeSlots] = useState([{ day: "", from: "", to: "" }]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/api/user/profile/");
        const data = res.data || {};

        setFormData({
          full_name: data.full_name || "",
          grade: data.grade != null ? String(data.grade) : "",
          learning_goals: data.learning_goals || "",
        });

        // školu pokušaj povući iz API-ja (ako postoji)
        // očekujem: data.school_type = "osnovna" | "srednja"
        if (data.school_type === "osnovna" || data.school_type === "srednja") {
          setSchoolType(data.school_type);
        }

        // preferred_times -> parse u {day, from, to}
        const fromApi = Array.isArray(data.preferred_times) ? data.preferred_times : [];
        const parsed = fromApi.map(parsePreferredRange).filter(Boolean);
        setTimeSlots(parsed.length ? parsed : [{ day: "", from: "", to: "" }]);

        // subjects -> očekujem array: [{name:"Matematika", level:"dobra"}, ...]
        const subj = Array.isArray(data.subjects) ? data.subjects : [];
        const nextMap = { Matematika: "", Fizika: "", Informatika: "" };
        subj.forEach((s) => {
          const name = s?.name;
          const level = s?.level;
          if (name && Object.prototype.hasOwnProperty.call(nextMap, name)) {
            nextMap[name] = level ?? "";
          }
        });
        setSubjectLevels(nextMap);
      } catch (err) {
        console.error(err);
      }
    };

    fetchProfile();
  }, []);

  // kad se promijeni schoolType, očisti grade ako više nije validan
  useEffect(() => {
    if (!schoolType) return;
    if (!formData.grade) return;

    const ok = gradeOptions.includes(String(formData.grade));
    if (!ok) setFormData((p) => ({ ...p, grade: "" }));
  }, [schoolType, gradeOptions, formData.grade]);

  const handleSlotChange = (index, field, value) => {
    setTimeSlots((prev) =>
      prev.map((slot, i) => (i === index ? { ...slot, [field]: value } : slot))
    );
  };

  const handleTimePartChange = (index, field, part, value) => {
    // field: "from" | "to", part: "hour" | "minute"
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

  const handleAddSlot = () => setTimeSlots((prev) => [...prev, { day: "", from: "", to: "" }]);
  const handleRemoveSlot = (index) => setTimeSlots((prev) => prev.filter((_, i) => i !== index));

  const inputStyle =
    "w-full p-2.5 rounded-xl border-none bg-white/80 focus:bg-white focus:outline-none text-[#215993] placeholder-[#3674B5]/40 transition-all";
  const labelStyle = "block text-[13px] font-bold text-[#3674B5] mb-1.5 ml-1";

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // složi preferred_times: "Dan HH:MM-HH:MM"
      const preferred_times = timeSlots
        .filter((s) => s.day && s.from && s.to)
        .filter((s) => {
          const a = toMinutes(s.from);
          const b = toMinutes(s.to);
          return a != null && b != null && b > a; // end mora biti nakon start
        })
        .map((s) => `${s.day} ${s.from}-${s.to}`);

      // složi subjects: samo oni koji imaju level
      const subjects = SUBJECTS.map((name) => ({
        name,
        level: subjectLevels[name] || null,
      })).filter((x) => x.level);

      await api.patch("/api/user/profile/", {
        full_name: formData.full_name, // ako backend dopušta
        school_type: schoolType || null,
        grade: formData.grade || null,
        learning_goals: formData.learning_goals,
        preferred_times,
        subjects,
      });

      navigate("/home/student");
    } catch (err) {
      console.error(err);
      alert("Greška pri spremanju.");
    } finally {
      setLoading(false);
    }
  };

  return (
      <>
      <Header />

      <div className="w-full max-w-4xl rounded-[32px] bg-[#D1F8EF] p-8 shadow-xl border border-white/20">
        <form onSubmit={onSubmit}>
          <div className="flex flex-col md:flex-row gap-8">
            {/* Avatar / ime */}
            <div className="w-full md:w-1/3 flex flex-col items-center">
              <div className="w-56 h-56 bg-[#A8A8A8] rounded-3xl flex items-end justify-center overflow-hidden border-4 border-white/50">
                <img src={defaultAvatar} alt="Avatar" className="h-full w-full object-cover" />
              </div>

              <h2 className="mt-4 text-3xl font-bold text-[#215993]">
                {formData.full_name || "Student"}
              </h2>
            </div>

            {/* Desno: podaci */}
            <div className="flex-1 space-y-5">
              {/* Škola */}
              <div>
                <label className={labelStyle}>Škola:</label>
                <select
                  className={inputStyle}
                  value={schoolType}
                  onChange={(e) => setSchoolType(e.target.value)}
                  required
                >
                  <option value="">Odaberi</option>
                  <option value="osnovna">Osnovna škola</option>
                  <option value="srednja">Srednja škola</option>
                </select>
              </div>

              {/* Razred */}
              <div>
                <label className={labelStyle}>Razred:</label>
                <select
                  className={inputStyle}
                  value={formData.grade}
                  onChange={(e) => setFormData((p) => ({ ...p, grade: e.target.value }))}
                  disabled={!schoolType}
                  required
                >
                  <option value="">{schoolType ? "Odaberi razred" : "Prvo odaberi školu"}</option>
                  {gradeOptions.map((g) => (
                    <option key={g} value={g}>
                      {g}.
                    </option>
                  ))}
                </select>
              </div>

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
                          setSubjectLevels((p) => ({ ...p, [subj]: e.target.value }))
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
                <label className={labelStyle}>Preferirani termini (od–do):</label>

                <div className="space-y-3">
                  {timeSlots.map((slot, index) => {
                    const [fromH = "08", fromM = "00"] = (slot.from || "").split(":");
                    const [toH = "09", toM = "00"] = (slot.to || "").split(":");

                    const validRange = slot.from && slot.to
                      ? (toMinutes(slot.to) > toMinutes(slot.from))
                      : true;

                    return (
                      <div
                        key={index}
                        className="flex flex-col gap-2"
                      >
                        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                          {/* Dan */}
                          <select
                            className={`${inputStyle} sm:w-40`}
                            value={slot.day}
                            onChange={(e) => handleSlotChange(index, "day", e.target.value)}
                            required
                          >
                            <option value="">Odaberi dan</option>
                            {DAYS.map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>

                          {/* OD */}
                          <div className="flex items-center gap-2">
                            <span className="text-[#215993] font-semibold">Od</span>
                            <select
                              className={`${inputStyle} w-24`}
                              value={fromH || "08"}
                              onChange={(e) => handleTimePartChange(index, "from", "hour", e.target.value)}
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
                              onChange={(e) => handleTimePartChange(index, "from", "minute", e.target.value)}
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
                            <span className="text-[#215993] font-semibold">Do</span>
                            <select
                              className={`${inputStyle} w-24`}
                              value={toH || "09"}
                              onChange={(e) => handleTimePartChange(index, "to", "hour", e.target.value)}
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
                              onChange={(e) => handleTimePartChange(index, "to", "minute", e.target.value)}
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

                        {/* Validacija */}
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
            </div>
          </div>

          {/* Donji blokovi */}
          {/* Donji dio: ciljevi full width + gumbi na dnu */}
<div className="mt-8 space-y-4">
  {/* Ciljevi učenja - preko cijele širine */}
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

  {/* Gumbi - na dnu */}
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
    </>
  );
}
