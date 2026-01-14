import { useState, useEffect } from "react";
import Header from "../components/Header";
import TerminForm from "../components/TerminForm";
import TerminCard from "../components/TerminCard";
import { ACCESS_TOKEN } from "../constants";
import api from "../api";
import QuizBuilder from "../components/QuizBuilder";
import ShortAnswerDisplay from "../components/ShortAnswerDisplay";
import TrueFalseDisplay from "../components/TrueFalseDisplay";
import MultipleChoiceDisplay from "../components/MultipleChoiceDisplay";

const API_BASE_URL = import.meta.env.VITE_API_URL;

function Instructor() {
  const [showForm, setShowForm] = useState(false);
  const [termini, setTermini] = useState([]);
  const [user, setUser] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [tab, setTab] = useState("termini");
  const [questions, setQuestions] = useState([]);
  // Učitaj instruktorova pitanja
  useEffect(() => {
    if (tab !== "pitanja") return;
    const loadQuestions = async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await api.get(`${API_BASE_URL}/api/instructor/questions/my/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        setQuestions(res.data);
      } catch (e) {
        setErr("Greška prilikom učitavanja pitanja");
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, [tab]);

  // Učitaj token korisnika.
  useEffect(() => {
    setAccessToken(localStorage.getItem(ACCESS_TOKEN));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000); // Osvježava svaku minutu

    return () => clearInterval(timer); // Čisti timer kad se ode sa stranice
  }, []);

  // Učitaj profil kad imamo accessToken - zbog instructor_id-a.
  // Ako je odgovor dobar spremi ga u user
  useEffect(() => {
    if (!accessToken) return;
    fetch(`${API_BASE_URL}/api/user/profile/`, {
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
        const res = await fetch(`${API_BASE_URL}/api/lessons/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        });
        // Ako odgovor s backenda nije dobar ispiši grešku
        if (!res.ok) {
          const txt = await res.text();
          setErr(`Greška ${res.status}`);
          return;
        }
        const data = await res.json();

        // Filter termina samo od prijavljenog instruktora
        const mine =
          user?.instructor_id != null
            ? data.filter(
                (l) => String(l.instructor_id) === String(user.instructor_id)
              )
            : data; // dok profil ne stigne, možeš privremeno prikazati sve ili prazno
        setTermini(mine);
      } catch (e) {
        setErr("Mrežna greška");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [accessToken, user?.instructor_id]);

  const visibleTermini = termini.filter((t) => {
    const lessonDateTime = new Date(`${t.date}T${t.time}`);
    const limit = new Date(lessonDateTime.getTime() + 15 * 60 * 1000);
    return currentTime <= limit;
  });

  const deleteTermin = async (lesson_id) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    try {
      const res = await api.delete(
        `${API_BASE_URL}/api/termin/delete/${lesson_id}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setTermini((prevTermins) =>
        prevTermins.filter((t) => t.lesson_id !== lesson_id)
      );
    } catch (err) {}
  };

  const renderQuestion = (q) => {
    const commonProps = { text: q.text, correctAnswer: q.correct_answer };

    switch (q.type) {
      case "short_answer":
        return <ShortAnswerDisplay {...commonProps} />;
      case "true_false":
        return <TrueFalseDisplay {...commonProps} />;
      case "multiple_choice":
        return <MultipleChoiceDisplay {...commonProps} options={q.options} />;
      default:
        return <p className="text-red-400">Nepoznat tip pitanja</p>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#3674B5] to-[#A1E3F9] font-[Outfit] flex flex-col pt-24">
      <Header />

      <div className="max-w-2xl w-full mx-auto px-4">
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setTab("termini")}
            className={`text-2xl font-semibold hover:scale-110
    transition-transform duration-[300ms]
      ${tab === "termini" ? "text-white" : "text-white/70"}`}
          >
            Moji termini
          </button>

          <button
            onClick={() => setTab("pitanja")}
            className={`text-2xl font-semibold hover:scale-110
    transition-transform duration-[300ms]
      ${tab === "pitanja" ? "text-white" : "text-white/70"}`}
          >
            Moja pitanja
          </button>
        </div>

        {tab === "termini" && (
          <>
            {err && <div className="mt-3 text-red-200">{err}</div>}
            {loading && <div className="mt-3 text-white/90">Učitavam…</div>}

            <ul className="mt-4 space-y-3">
              {visibleTermini.map((t) => (
                <li key={t.lesson_id ?? t.id}>
                  <TerminCard
                    termin={t}
                    role="instructor"
                    onTerminDelete={deleteTermin}
                  />
                </li>
              ))}

              {!loading && visibleTermini.length === 0 && !err && (
                <li className="text-white/90">
                  Nema termina za ovog instruktora.
                </li>
              )}
            </ul>
          </>
        )}
      </div>

      {tab === "termini" && (
        <>
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
                <h2 className="text-2xl font-bold mb-4 text-center">
                  Novi termin
                </h2>
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
        </>
      )}
      {tab === "pitanja" && (
        <div className="pb-20">
          <QuizBuilder onCreated={(q) => setQuestions([q, ...questions])} />
          <div className="mt-12 space-y-6 flex flex-col items-center justify-center">
            {loading && <p className="text-white/70">Učitavam...</p>}
            {questions.map((q) => (
              <div
                key={q.id}
                className="w-full max-w-4xl bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-xl"
              >
                <div className="flex justify-between items-center mb-4 text-[10px] uppercase font-bold text-[#D1F8EF]">
                  <span>
                    {q.subject_name || "Opće"} • {q.grade}. razred
                  </span>
                </div>
                {renderQuestion(q)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Instructor;
