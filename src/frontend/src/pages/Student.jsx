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
  const [currentTime, setCurrentTime] = useState(new Date());

  const [filters, setFilters] = useState({
    format: null, // "online" | "uzivo"
    subject: [], // "matematika" | "fizika" | "informatika"
    days: null, // 7 | 14
    rating: null, // 4 | 5
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000); // Osvježava svaku minutu

    return () => clearInterval(timer); // Čisti timer kad se ode sa stranice
  }, []);

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

        // Spremi listu termina.
        setTermini(list);
      } catch (e) {
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
      } catch (e) {}
    };

    loadMine();
  }, [tab]);

  const reserveOrCancelLesson = async (lesson_id) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    const isReserved = myLessonIds.has(lesson_id);
    const endpoint = isReserved
      ? `api/lessons/cancel/`
      : `api/lessons/reserve/`;

    try {
      const res = await api.post(
        `${API_BASE_URL}/${endpoint}`,
        {
          lesson_id: lesson_id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (isReserved) {
        setMyTermini((prev) => prev.filter((t) => t.lesson_id !== lesson_id));
      } else {
        const reservedTermin = termini.find((t) => t.lesson_id === lesson_id);
        setMyTermini((prev) =>
          reservedTermin ? [...prev, reservedTermin] : prev
        );
      }
    } catch (err) {}
  };

  const myLessonIds = new Set(myTermini.map((t) => t.lesson_id));

  const visibleTermini = (tab === "all" ? termini : myTermini).filter((t) => {
    const isMyLesson = myLessonIds.has(t.lesson_id);
    const lessonDateTime = new Date(`${t.date}T${t.time}`);

    const limit = isMyLesson
      ? new Date(lessonDateTime.getTime() + 15 * 60 * 1000)
      : lessonDateTime;

    if (currentTime > limit) return false;

    return true;
  });

  const filteredTermini =
    tab === "all"
      ? visibleTermini.filter((t) => {
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
      : visibleTermini;

  const [sortBy, setSortBy] = useState(null); // "date_asc" | "date_desc" | "rating_desc" | "price_asc" | "price_desc"
  const toggleSort = (key) => {
    setSortBy((prev) => (prev === key ? null : key));
  };
  const sortedTermini = [...filteredTermini].sort((a, b) => {
    if (!sortBy) return 0;

    const aDate = new Date(`${a.date}T${a.time}`);
    const bDate = new Date(`${b.date}T${b.time}`);

    const priceA = (parseFloat(a.price) * a.duration_min) / 60;
    const priceB = (parseFloat(b.price) * b.duration_min) / 60;

    const ratingA = parseFloat(a.teacher_rating);
    const ratingB = parseFloat(b.teacher_rating);

    switch (sortBy) {
      case "date_asc":
        return aDate - bDate;
      case "date_desc":
        return bDate - aDate;
      case "rating_desc":
        return ratingB - ratingA;
      case "price_asc":
        return priceA - priceB;
      case "price_desc":
        return priceB - priceA;
      default:
        return 0;
    }
  });

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
                  onReserveOrCancel={reserveOrCancelLesson}
                  onTerminDelete={null}
                  canReserve={tab === "all"}
                  reserved={myLessonIds.has(t.lesson_id)}
                />
              </li>
            ))}
            {(tab === "all" ? visibleTermini : myTermini).length === 0 && (
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
              <div className="flex gap-3"></div>
              <button
                onClick={() => setShowFilters(false)}
                className="w-full bg-[#3674B5] py-3 rounded-xl font-bold text-white hover:bg-[#2a5a8c] duration-[500ms] hover:scale-105"
              >
                OK
              </button>
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
              ].map(([key, label]) => {
                const isActive = sortBy === key;
                return (
                  <button
                    key={key}
                    onClick={() => toggleSort(key)} // Koristimo funkciju koja hendla paljenje/gašenje
                    className={`w-full text-left px-4 py-3 rounded-lg mb-2 transition-colors
                    ${
                      isActive
                        ? "bg-[#3674B5] text-white shadow-md"
                        : "bg-white text-[#3674B5] hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span>{label}</span>
                    </div>
                  </button>
                );
              })}
              <button
                onClick={() => setShowSort(false)}
                className="w-full bg-[#3674B5] py-3 rounded-xl font-bold text-white hover:bg-[#2A5A8C] duration-[500ms] hover:scale-105"
              >
                OK
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Student;
