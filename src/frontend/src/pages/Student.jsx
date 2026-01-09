import { useEffect, useState } from "react";
import Header from "../components/Header";
import TerminCard from "../components/TerminCard";
import { ACCESS_TOKEN } from "../constants";
import api from "../api";
import LogoBulbLoader from "../components/LogoBulbProgress";

const API_BASE_URL = import.meta.env.VITE_API_URL;

function Student() {
  const [termini, setTermini] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("all");
  const [err, setErr] = useState(null);
  const [myTermini, setMyTermini] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);

  const [filters, setFilters] = useState({
    format: null, // "online" | "uzivo"
    subject: [], // "matematika" | "fizika" | "informatika"
    days: null, // 7 | 14
    rating: null, // 4 | 5
  });

  const [sortBy, setSortBy] = useState(null);
  // "date_asc" | "date_desc" | "rating_desc"
  const filterBtnClass = (active) =>
    `px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-200
   ${
     active
       ? "bg-[#3674B5] text-white border-[#3674B5] ring-2 ring-[#3674B5]/30 shadow-md"
       : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"
   }`;

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

    try {
      const res = await fetch(`${API_BASE_URL}/api/lessons/reserve/`, {
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

      // ✅ OVO JE KLJUČ
      setMyTermini((prev) => {
        // ako je već unutra – ne dodaj
        if (prev.some((t) => t.lesson_id === lesson_id)) return prev;

        // pronađi puni termin iz `termini`
        const reservedTermin = termini.find((t) => t.lesson_id === lesson_id);

        return reservedTermin ? [...prev, reservedTermin] : prev;
      });

      alert("Termin uspješno rezerviran ✅");
    } catch (err) {
      console.error(err);
      alert("Greška pri rezervaciji ❌");
    }
  };

  const myLessonIds = new Set(myTermini.map((t) => t.lesson_id));
  const applyFilters = () => {
    console.log("Primijenjeni filteri:", filters);
    setShowFilters(false);
  };

  const filteredTermini =
    tab === "all"
      ? termini.filter((t) => {
          if (filters.format && t.format !== filters.format) return false;

          /*KAD FABO NAPRAVI OVO CE RADIT*/
          if (
            filters.subject.length > 0 &&
            !filters.subject.includes(t.subject)
          ) {
            return false;
          }

          if (filters.days) {
            const now = new Date();
            const lessonDateTime = new Date(`${t.date}T${t.time}`);

            const diff = (lessonDateTime - now) / (1000 * 60 * 60 * 24);

            if (diff < 0) return false; // prošli termini ❌
            if (diff > filters.days) return false; // predaleko u budućnosti ❌
          }

          /*OVDJE DODAT OCJENE*/
          /*if (filters.rating && t.teacher_rating < filters.rating) return false;*/

          return true;
        })
      : myTermini;
  const sortedTermini = sortBy
    ? [...filteredTermini].sort((a, b) => {
        const aDate = new Date(`${a.date}T${a.time}`);
        const bDate = new Date(`${b.date}T${b.time}`);

        if (sortBy === "date_asc") {
          return aDate - bDate;
        }

        if (sortBy === "date_desc") {
          return bDate - aDate;
        }

        if (sortBy === "rating_desc") {
          return (b.teacher_rating ?? 0) - (a.teacher_rating ?? 0);
        }
        if (sortBy === "price_asc") {
          return (a.price ?? 0) - (b.price ?? 0);
        }
        if (sortBy === "price_desc") {
          return (b.price ?? 0) - (a.price ?? 0);
        }

        return 0;
      })
    : filteredTermini;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#3674B5] to-[#A1E3F9] font-[Outfit] flex flex-col pt-24">
      <Header />
      <div className="max-w-3xl w-full mx-auto px-4 pb-16">
        <div className="px-4 pt-4 flex gap-6">
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
        <div className="mt-4 px-4 flex gap-3">
          {tab === "all" && (
            <>
              <button
                onClick={() => setShowFilters(true)}
                className="px-3 py-1.5 rounded-xl bg-white/90 border text-bold text-[#3674B5] font-medium hover:bg-white transition"
              >
                🔍 Filter
              </button>

              <button
                onClick={() => setShowSort(true)}
                className="px-3 py-1.5 rounded-xl bg-white/90 border text-bold text-[#3674B5] font-medium hover:bg-white transition"
              >
                ⇅ Sort
              </button>
            </>
          )}
        </div>

        {err && (
          <div className="mt-4 bg-red-50/80 text-red-700 rounded-xl p-3 border border-red-200">
            {err}
          </div>
        )}
        {loading && (
          <div className="mt-4 text-white/90">
            <LogoBulbLoader />
          </div>
        )}
        {!loading && !err && (
          <ul className="mt-6 space-y-3">
            {sortedTermini.map((t) => (
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
        {showFilters && (
  <div
    className="
      fixed inset-0 z-40 bg-black/40 backdrop-blur-sm
      flex justify-center
      pt-32
    "
  >
    {/* overlay click */}
    <div
      className="absolute inset-0"
      onClick={() => setShowFilters(false)}
    />

    {/* modal */}
    <div
      className="
        relative
        bg-gradient-to-b from-[#D1F8EF] to-[#A1E3F9]
        w-[90%] max-w-md
        rounded-2xl
        p-5
        shadow-2xl
        font-[Outfit]
        max-h-[calc(100vh-6rem)]
        overflow-y-auto
        self-start
      "
    >

      <h2 className="text-lg font-semibold mb-4 text-[#3674B5]">
        Filteri
      </h2>
              {/* FORMAT */}
              <div className="mb-4">
                <p className=" font-semibold tracking-wide text-[#3674B5] mb-2">
                  Način
                </p>

                <div className="flex gap-2">
                  {["Online", "Uživo"].map((m) => {
                    const isActive = filters.format === m;

                    return (
                      <button
                        key={m}
                        onClick={() =>
                          setFilters((f) => ({
                            ...f,
                            format: isActive ? null : m,
                          }))
                        }
                        className={filterBtnClass(isActive)}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SUBJECT */}
              <div className="mb-4">
                <p className=" font-semibold tracking-wide text-[#3674B5] mb-2">
                  Predmet
                </p>
                <div className="flex gap-2 flex-wrap">
                  {["Matematika", "Fizika", "Informatika"].map((s) => {
                    const isActive = filters.subject.includes(s);

                    return (
                      <button
                        key={s}
                        onClick={() =>
                          setFilters((f) => ({
                            ...f,
                            subject: isActive
                              ? f.subject.filter((item) => item !== s)
                              : [...f.subject, s],
                          }))
                        }
                        className={filterBtnClass(isActive)}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* DAYS */}
              <div className="mb-4">
                <p className=" font-semibold tracking-wide text-[#3674B5] mb-2">
                  Dostupnost
                </p>
                <div className="flex gap-2">
                  {[7, 14].map((d) => {
                    const isActive = filters.days === d;

                    return (
                      <button
                        key={d}
                        onClick={() =>
                          setFilters((f) => ({
                            ...f,
                            days: isActive ? null : d,
                          }))
                        }
                        className={filterBtnClass(isActive)}
                      >
                        &lt;{d} dana
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* RATING */}
              <div className="mb-6">
                <p className=" font-semibold tracking-wide text-[#3674B5] mb-2">
                  Ocjena
                </p>
                {[3, 4, 5].map((r) => {
                  const isActive = filters.rating === r;

                  return (
                    <button
                      key={r}
                      onClick={() =>
                        setFilters((f) => ({
                          ...f,
                          rating: isActive ? null : r,
                        }))
                      }
                      className={filterBtnClass(isActive)}
                    >
                      ⭐ {r}+
                    </button>
                  );
                })}
              </div>

              {/* ACTIONS */}
              <div className="flex gap-3">
                <button
                  onClick={applyFilters}
                  className="flex-1 bg-[#578FCA] py-2 rounded-lg font-semibold tracking-wide text-[#D1F8EF] mb-2"
                >
                  Primijeni
                </button>

                <button
                  onClick={() => {
                    setShowFilters(false);
                    setFilters({
                      format: null,
                      subject: [],
                      days: null,
                      rating: null,
                    });
                  }}
                  className="flex-1 bg-[#578FCA] py-2 rounded-lg font-semibold tracking-wide text-[#D1F8EF] mb-2"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}
        {showSort && (
  <div
    className="
      fixed inset-0 z-40 bg-black/40 backdrop-blur-sm
      flex justify-center
      pt-32
    "
  >
    {/* overlay click */}
    <div
      className="absolute inset-0"
      onClick={() => setShowSort(false)}
    />

    {/* modal */}
    <div
      className="
        relative
        bg-gradient-to-b from-[#D1F8EF] to-[#A1E3F9]
        w-[90%] max-w-md
        rounded-2xl
        p-5
        shadow-2xl
        font-[Outfit]
        max-h-[calc(100vh-6rem)]
        overflow-y-auto
        self-start
      "
    >
      <h2 className="text-xl font-semibold mb-5 text-[#3674B5]">
        Sortiranje
      </h2>

      {[
        ["date_asc", "Najraniji termin"],
        ["date_desc", "Najkasniji termin"],
        ["rating_desc", "Najbolja ocjena"],
        ["price_asc", "Najniža cijena"],
        ["price_desc", "Najviša cijena"],
      ].map(([key, label]) => (
        <button
          key={key}
          onClick={() => {
            setSortBy(key);
            setShowSort(false);
          }}
          className={`w-full text-left px-4 py-3 rounded-lg mb-2
            ${
              sortBy === key
                ? "bg-[#3674B5] text-white"
                : "bg-white text-[#3674B5]"
            }`}
        >
          {label}
        </button>
      ))}
    </div>
  </div>
)}

      </div>
    </div>
  );
}

export default Student;
