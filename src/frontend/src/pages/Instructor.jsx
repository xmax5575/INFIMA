import { useState, useEffect } from "react";
import Header from "../components/Header";
import TerminForm from "../components/TerminForm";
import TerminCard from "../components/TerminCard";
import { ACCESS_TOKEN } from "../constants";

function Instructor() {
  const [showForm, setShowForm] = useState(false);
  const [termini, setTermini] = useState([]);
  const [user, setUser] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);
  const [accessToken, setAccessToken] = useState(null);

  // Učitaj token korisnika.
  useEffect(() => {
    setAccessToken(localStorage.getItem(ACCESS_TOKEN));
  }, []);

  // Učitaj profil kad imamo accessToken - zbog instructor_id-a.
  // Ako je odgovor dobar spremi ga u user
  useEffect(() => {
    if (!accessToken) return;
    fetch("http://127.0.0.1:8000/api/user/profile/", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then(setUser)
      .catch(() => setUser(null));
  }, [accessToken]);

  // Učitaj sve lekcije, pa filtiraj
  useEffect(() => {
    if (!accessToken) return;
    const load = async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch("http://127.0.0.1:8000/api/lessons/", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        });
        // Ako odgovor s backenda nije dobar ispiši grešku
        if (!res.ok) {
          const txt = await res.text();
          console.error("Greška:", res.status, txt);
          setErr(`Greška ${res.status}`);
          return;
        }
        const data = await res.json();
        console.log("Sve lekcije:", data);

        // Filter termina samo od prijavljenog instruktora
        const mine =
          user?.instructor_id != null
            ? data.filter(
                (l) => String(l.instructor_id) === String(user.instructor_id)
              )
            : data; // dok profil ne stigne, možeš privremeno prikazati sve ili prazno

        console.log("Moji termini:", mine);
        setTermini(mine);
      } catch (e) {
        console.error("Network/parse error:", e);
        setErr("Mrežna greška");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [accessToken, user?.instructor_id]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#3674B5] to-[#A1E3F9] font-[Outfit] flex flex-col pt-24">
      <Header />

      <div className="max-w-2xl w-full mx-auto px-4">
        <h1 className="text-2xl font-semibold text-white">Moji termini</h1>
        {err && <div className="mt-3 text-red-200">{err}</div>}
        {loading && <div className="mt-3 text-white/90">Učitavam…</div>}
        {/* Za svaki termin napravi TerminCard u kojem se šalju potrebne informacije/podatci */}
        <ul className="mt-4 space-y-3">
          {termini.map((t) => (
            <li key={t.lesson_id ?? t.id}>
              <TerminCard
                termin={t}
                onClick={() => {
                  console.log("Otvoren termin:", t);
                }}
                role="instructor"
              />
            </li>
          ))}

          {!loading && termini.length === 0 && !err && (
            <li className="text-white/90">Nema termina za ovog instruktora.</li>
          )}
        </ul>
      </div>

      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-[#D1F8EF] text-[#3674B5] text-3xl font-bold
          shadow hover:shadow-lg transition-transform hover:scale-110 flex items-center justify-center
          border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3674B5]/40"
      >
        +
      </button>

      {showForm && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-center items-center p-4 overflow-y-auto"
          onClick={() => setShowForm(false)}
        >
          <div
            className="relative bg-[#D1F8EF] text-[#3674B5] rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-4 text-center">Novi termin</h2>
            <TerminForm
              onClose={() => setShowForm(false)}
              onCreated={(novi) => {
                // Ako backend vraća instructor_id
                setTermini((prev) => [novi, ...prev]);
                setShowForm(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Instructor;
