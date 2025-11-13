import { useEffect, useState } from "react";
import Header from "../components/Header";
import TerminCard from "../components/TerminCard";
import { ACCESS_TOKEN } from "../constants";

const API_BASE_URL = import.meta.env.VITE_API_URL;

function Student() {
  const [termini, setTermini] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  // Pokušaj iz više mogućih mjesta izvući ime instruktora
  const getInstructorDisplay = (t) => {
    if (!t) return "Nepoznat instruktor";
    // 1) ugniježđeni objekti
    if (t.instructor) {
      const obj = t.instructor;
      const byFull = obj.full_name || obj.name;
      const bySplit = [obj.first_name, obj.last_name].filter(Boolean).join(" ");
      if (byFull || bySplit) return byFull || bySplit;
    }
    if (t.teacher) {
      const obj = t.teacher;
      const byFull = obj.full_name || obj.name;
      const bySplit = [obj.first_name, obj.last_name].filter(Boolean).join(" ");
      if (byFull || bySplit) return byFull || bySplit;
    }
    // 2) ravna polja
    const flat =
      t.instructor_name ||
      t.instructor_full_name ||
      t.teacher_name ||
      t.mentor_name;
    if (flat) return flat;

    // 3) samo id – privremeno prikaži “Instruktor #id”
    if (t.instructor_id != null) return `Instruktor #${t.instructor_id}`;

    return "Nepoznat instruktor";
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErr(null);
      const token = localStorage.getItem(ACCESS_TOKEN);

      try {
        const res = await fetch(`${API_BASE_URL}/api/lessons/`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
        });

        if (!res.ok) {
          const txt = await res.text();
          console.error("Greška /api/lessons/:", res.status, txt);
          if (res.status === 401) {
            setErr("Nisi prijavljen/a (401). Ulogiraj se pa pokušaj ponovno.");
          } else {
            setErr("Ne mogu dohvatiti termine. Probaj kasnije.");
          }
          setTermini([]);
          return;
        }

        const data = await res.json();
        const list = Array.isArray(data) ? data : [];

        // DEBUG: pokaži kako izgleda jedan zapis
        if (list.length) {
          console.log("Primjer lekcije:", list[0]);
          console.log("Ključevi:", Object.keys(list[0] || {}));
        }

        const normalized = list.map((t) => ({
          ...t,
          instructor_display: getInstructorDisplay(t),
        }));

        setTermini(normalized);
      } catch (e) {
        console.error("Network/parse error:", e);
        setErr("Mrežna greška. Provjeri backend ili konekciju.");
        setTermini([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#3674B5] to-[#A1E3F9] font-[Outfit] flex flex-col pt-24">
      <Header />

      <div className="max-w-3xl w-full mx-auto px-4 pb-16">
        <h1 className="text-2xl font-semibold text-white">Svi termini</h1>

        {err && (
          <div className="mt-4 bg-red-50/80 text-red-700 rounded-xl p-3 border border-red-200">
            {err}
          </div>
        )}

        {loading && <div className="mt-4 text-white/90">Učitavam termine…</div>}

        {!loading && !err && (
          <ul className="mt-6 space-y-3">
            {termini.map((t) => (
              <li key={t.id ?? t.lesson_id ?? `${t.date}-${t.time}-${Math.random()}`}>
                <TerminCard termin={t} />
              </li>
            ))}
            {termini.length === 0 && (
              <li className="text-white/90">Trenutno nema dostupnih termina.</li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Student;
