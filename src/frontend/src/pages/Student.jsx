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
  const [myTermini, setMyTermini] = useState([]);

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
    const loadMine = async () => {
      const token = localStorage.getItem(ACCESS_TOKEN);

      try {
        const res = await fetch(`${API_BASE_URL}/api/student/lessons/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        setMyTermini(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
      }
    };

    loadMine();
  }, [tab]);

  const reserveLesson = async (lesson_id) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    const isReserved = myLessonIds.has(lesson_id);
    const endpoint = isReserved
      ? `api/lessons/cancel/`
      : `api/lessons/reserve/`;

    try {
      const res = await fetch(`${API_BASE_URL}/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ lesson_id }),
      });

      if (!res.ok) {
        throw new Error("Neuspješna rezervacija");
      }

      if (isReserved) {
        setMyTermini((prev) => prev.filter((t) => t.lesson_id !== lesson_id));
        alert("Rezervacija otkazana");
      } else {
        const reservedTermin = termini.find((t) => t.lesson_id === lesson_id);
        setMyTermini((prev) =>
          reservedTermin ? [...prev, reservedTermin] : prev
        );
        alert("Termin uspješno rezerviran ✅");
      }
    } catch (err) {
      console.error(err);
      alert("Greška pri rezervaciji ❌");
    }
  };

  const myLessonIds = new Set(myTermini.map((t) => t.lesson_id));

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
            {(tab === "all" ? termini : myTermini).map((t) => (
              <li key={t.lesson_id}>
                <TerminCard
                  termin={t}
                  role="student"
                  onReserve={reserveLesson}
                  canReserve={tab === "all"}
                  reserved={myLessonIds.has(t.lesson_id)}
                />
              </li>
            ))}
            {(tab === "all" ? termini : myTermini).length === 0 && (
              <li className="text-white/90">Nema termina za ovaj prikaz.</li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Student;
