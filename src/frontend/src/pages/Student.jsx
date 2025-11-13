import { useEffect, useState } from "react";
import Header from "../components/Header";
import TerminCard from "../components/TerminCard";
import { ACCESS_TOKEN } from "../constants";

function Student() {
  const [termini, setTermini] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErr(null);
      const token = localStorage.getItem(ACCESS_TOKEN);

      try {
        // Dohvati sve terminte instrukcija i neka ih backend vrati u json formatu.
        const res = await fetch("http://127.0.0.1:8000/api/lessons/", {
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
              <li key={t.lesson_id}>
                <TerminCard termin={t} role="student" />
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
