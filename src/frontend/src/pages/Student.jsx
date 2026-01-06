import { useEffect, useState } from "react";
import Header from "../components/Header";
import TerminCard from "../components/TerminCard";
import { ACCESS_TOKEN } from "../constants";
import api from "../api";


const API_BASE_URL = import.meta.env.VITE_API_URL;

function Student() {
  const [termini, setTermini] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("all");
  const [err, setErr] = useState(null);
  const [studentId, setStudentId] = useState(null);


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
        });

        // Ako ne možemo dohvatiti termine postavi error poruku.
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

        // Ako nam backend vrati odgovor, spremi u data i tu imamo sve potrebne podatke za slati u TerminCard.
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];

        // DEBUG: pokaži kako izgleda jedan zapis
        if (list.length) {
          console.log("Primjer lekcije:", list[0]);
          console.log("Ključevi:", Object.keys(list[0] || {}));
        }
        // Spremi listu termina.
        setTermini(list);
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
  useEffect(() => {
  const loadMe = async () => {
    try {
      const res = await api.get("/api/student/inf/");
      console.log("Ulogirani student:", res.data);

      setStudentId(res.data.id); // ⬅️ OVO TI TREBA
    } catch (err) {
      console.error("Greška pri dohvaćanju studenta (/api/me)", err);
    }
  };

  loadMe();
}, []);


  const reserveLesson = async (lesson_id, student_id) => {
    console.log(lesson_id, student_id);
    const token = localStorage.getItem(ACCESS_TOKEN);

    /*try {
      const res = await fetch(`${API_BASE_URL}/api/lessons/reserve/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          lesson_id,
          student_id,
        }),
      });

      if (!res.ok) {
        throw new Error("Neuspješna rezervacija");
      }

      alert("Termin uspješno rezerviran ✅");
    } catch (err) {
      console.error(err);
      alert("Greška pri rezervaciji ❌");
    }*/
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#3674B5] to-[#A1E3F9] font-[Outfit] flex flex-col pt-24">
      <Header />
      <div className="max-w-3xl w-full mx-auto px-4 pb-16">
        <div className="px-4 flex gap-6">
          <button
            onClick={() => setTab("all")}
            className={`text-2xl font-semibold hover:scale-110
    transition-transform duration-200
    ${tab === "all" ? "text-white" : "text-white/70"}`}
          >
            Svi termini
          </button>

          <button
            onClick={() => setTab("mine")}
            className={`text-2xl font-semibold hover:scale-110
    transition-transform duration-200
    ${tab === "mine" ? "text-white" : "text-white/70"}`}
          >
            Moji termini
          </button>
        </div>

        {err && (
          <div className="mt-4 bg-red-50/80 text-red-700 rounded-xl p-3 border border-red-200">
            {err}
          </div>
        )}
        {loading && <div className="mt-4 text-white/90">Učitavam termine…</div>}
        {!loading && !err && (
          <ul className="mt-6 space-y-3">
            {termini.map((t) => (
              <li key={t.lesson_id}>
                <TerminCard
                  termin={t}
                  role="student"
                  onReserve={reserveLesson}
                />
              </li>
            ))}
            {termini.length === 0 && (
              <li className="text-white/90">
                Trenutno nema dostupnih termina.
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Student;
