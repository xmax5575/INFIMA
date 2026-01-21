import { useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import TerminCard from "../components/TerminCard";
import api from "../api";
import { Trash2, Star } from "lucide-react";
import ShortAnswerDisplay from "../components/ShortAnswerDisplay";
import TrueFalseDisplay from "../components/TrueFalseDisplay";
import MultipleChoiceDisplay from "../components/MultipleChoiceDisplay";

//prikaz i upravljanje terminima recenzijama i pitanjima
//frontend ne provjerava role detaljno, renderamo UI i pozivamo endpointe
function Admin() {
  const [tab, setTab] = useState("termini");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  //podaci po tabovima
  const [termini, setTermini] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  const [currentTime, setCurrentTime] = useState(new Date());

  //real-time osvježavanje filtriranja termina, da se ne mora refreshat
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  //dohvat termina
  const loadTermini = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await api.get("/api/admin/lessons/");
      setTermini(Array.isArray(res.data) ? res.data : []);
    } catch {
      setErr("Greška prilikom učitavanja termina.");
    } finally {
      setLoading(false);
    }
  };
  //dohvat recenzcija
  const loadReviews = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await api.get("/api/admin/reviews/");
      setReviews(Array.isArray(res.data) ? res.data : []);
    } catch {
      setErr("Greška prilikom učitavanja recenzija.");
    } finally {
      setLoading(false);
    }
  };

  //dohvat pitanja
  const loadQuestions = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await api.get("/api/admin/questions/");
      setQuestions(Array.isArray(res.data) ? res.data : []);
    } catch {
      setErr("Greška prilikom učitavanja pitanja.");
    } finally {
      setLoading(false);
    }
  };

  //dohvat analitike
  const loadAnalytics = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await api.get("/api/admin/analytics/");
      setAnalytics(res.data);
    } catch {
      setErr("Greška prilikom učitavanja analitike.");
    } finally {
      setLoading(false);
    }
  };

  // prikaz podataka ovisno na kojem se tabu nalazimo
  useEffect(() => {
    if (tab === "termini") loadTermini();
    if (tab === "recenzije") loadReviews();
    if (tab === "pitanja") loadQuestions();
    if (tab === "analitika") loadAnalytics();
  }, [tab]);

  //opercaije brisanja za pojedine tabove

  const deleteTermin = async (lessonId) => {
    try {
      await api.delete(`/api/admin/lesson/${lessonId}/delete/`);
      setTermini((prev) => prev.filter((t) => t.lesson_id !== lessonId));
    } catch {
      setErr("Brisanje termina nije uspjelo.");
    }
  };

  const deleteReview = async (reviewId) => {
    try {
      await api.delete(`/api/review/delete/${reviewId}/`);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (e) {
      console.error(
        "DELETE REVIEW ERROR:",
        e.response?.status,
        e.response?.data,
      );
      setErr("Brisanje recenzije nije uspjelo.");
    }
  };

  const deleteQuestion = async (questionId) => {
    try {
      await api.delete(`/api/question/delete/${questionId}/`);
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
    } catch {
      setErr("Brisanje pitanja nije uspjelo.");
    }
  };

  //filtriranje aktualnih termina (onih koji jos nisu prosli)
  const visibleTermini = useMemo(() => {
    return termini.filter((t) => {
      if (!t?.date || !t?.time) return true;
      const dt = new Date(`${t.date}T${t.time}`);
      return currentTime <= dt;
    });
  }, [termini, currentTime]);

  const renderQuestion = (q) => {
    const commonProps = { text: q.text, correctAnswer: q.correct_answer };
    switch (q.type) {
      case "short_answer":
        return <ShortAnswerDisplay {...commonProps} />;
      case "true_false":
        return <TrueFalseDisplay {...commonProps} />;
      case "multiple_choice":
        return (
          <MultipleChoiceDisplay {...commonProps} options={q.options || []} />
        );
      default:
        return <p className="text-red-200">Nepoznat tip pitanja</p>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#3674B5] to-[#A1E3F9] font-[Outfit] flex flex-col pt-24">
      <Header />

      <div className="max-w-5xl w-full mx-auto px-4 pb-20 flex flex-col items-center">
        {/* TABOVI */}
        <div className="flex justify-center gap-10 mb-8 w-full">
          {["termini", "recenzije", "pitanja", "analitika"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-2xl font-semibold hover:scale-110 transition-transform duration-[350ms]
                ${tab === t ? "text-white" : "text-white/70"}`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {err && <div className="text-red-200">{err}</div>}
        {loading && <div className="text-white/90">Učitavam…</div>}

        {/* TERMINI */}
        {tab === "termini" && (
          <ul className="space-y-3">
            {termini.map((t) => (
              <TerminCard
                key={t.lesson_id}
                termin={t}
                role="admin"
                onTerminDelete={deleteTermin}
              />
            ))}
          </ul>
        )}

        {/* RECENZIJE */}
        {tab === "recenzije" && (
          <div className="mt-4 space-y-3">
            {reviews.map((r) => {
              return (
                <div
                  key={r.id}
                  className="group relative rounded-2xl bg-[#D1F8EF] border border-white/60 p-5 text-[#3674B5] shadow-lg hover:scale-[1.01] duration-[350ms] ease-in-out"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-lg font-semibold text-[#215993]">
                        Recenzija #{r.id}
                      </div>

                      <div className="mt-2 flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((v) => (
                          <Star
                            key={v}
                            className={`h-5 w-5 ${
                              v <= (r.rating || 0)
                                ? "text-[#3674B5] fill-[#3674B5]"
                                : "text-[#3674B5]/30"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => deleteReview(r.id)}
                      className="p-3 text-red-600 hover:bg-red-200 rounded-full
                        transition-all duration-[350ms] ease-in-out opacity-0 group-hover:opacity-100"
                      title="Obriši recenziju"
                    >
                      <Trash2 className="w-6 h-6" />
                    </button>
                  </div>

                  {r.description && (
                    <p className="mt-3 text-[#215993] whitespace-pre-wrap">
                      {r.description}
                    </p>
                  )}

                  <div className="mt-3 text-sm text-[#3674B5]/80">
                    {r.lesson_id && <>Lesson: {r.lesson_id}</>}
                    {r.instructor_id && <> • Instructor: {r.instructor_id}</>}
                  </div>
                </div>
              );
            })}

            {!loading && reviews.length === 0 && !err && (
              <div className="text-white/90">Nema recenzija za prikaz.</div>
            )}
          </div>
        )}

        {/* PITANJA */}
        {tab === "pitanja" && (
          <div className="mt-4 space-y-6 flex flex-col items-center justify-center">
            {questions.map((q) => (
              <div
                key={q.id}
                className="group relative w-full max-w-4xl bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-xl
                  hover:scale-[1.01] ease-in-out duration-[350ms]"
              >
                <div className="flex justify-between items-center mb-4 text-[10px] uppercase font-bold text-[#D1F8EF]">
                  <span>
                    {q.subject || "Opće"} {"\u00A0"} • {"\u00A0"} {q.difficulty}{" "}
                    {"\u00A0"} • {"\u00A0"} {q.grade}. razred
                  </span>
                </div>

                {renderQuestion(q)}

                <button
                  onClick={() => deleteQuestion(q.id)}
                  className="absolute top-3 right-3 p-3 text-red-400 hover:bg-red-400/20 rounded-full
                    transition-all duration-[350ms] ease-in-out opacity-0 group-hover:opacity-100"
                  title="Obriši pitanje"
                >
                  <Trash2 className="w-6 h-6" />
                </button>
              </div>
            ))}
            {!loading && questions.length === 0 && !err && (
              <div className="text-white/90">Nema pitanja za prikaz.</div>
            )}
          </div>
        )}

        {/* ANALITIKA */}
        {tab === "analitika" && analytics && (
          <div className="w-full max-w-xl bg-white/20 p-6 rounded-2xl text-white space-y-3">
            <div>
              📅 Ukupno rezervacija: <b>{analytics.total_reservations}</b>
            </div>
            <div>
              ❌ Otkazane rezervacije: <b>{analytics.cancelled_reservations}</b>
            </div>
            <div>
              📉 Stopa otkaza: <b>{analytics.cancellation_rate}%</b>
            </div>
            <div>
              ⭐ Prosječna ocjena: <b>{analytics.average_rating ?? "N/A"}</b>
            </div>
            <div>
              💬 Broj recenzija: <b>{analytics.total_reviews}</b>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;
