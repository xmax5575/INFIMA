import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api";
import LogoBulbLoader from "../components/LogoBulbProgress";
import QuizSolve from "./QuizSolve";

export default function Quiz({subject}) {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const pickRandomQuestions = (questions, count = 3) => {
  return [...questions]
    .sort(() => Math.random() - 0.5)
    .slice(0, count);
};

  useEffect(() => {
  const loadQuizzes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(
        `/api/student/quiz/${encodeURIComponent(subject)}/`
      );
      const random = pickRandomQuestions(res.data);
      setQuizzes(Array.isArray(random) ? random : []);
    } catch (e) {
      setError("Ne mogu dohvatiti kvizove.");
    } finally {
      setLoading(false);
    }
  };

  loadQuizzes();
}, [subject]);
return (
  <div className="bg-[#3674B5] p-12 px-4 rounded-xl">
    <h1 className="text-white text-2xl font-semibold mb-4">
      {subject} – kvizovi
    </h1>

    {loading && <LogoBulbLoader />}

    {error && <p className="text-red-200">{error}</p>}

    {!loading && (
      
        <div className="text-sm text-gray-500">
          <QuizSolve questions={quizzes} subject={subject} />

        </div>
    
    )}

    {!loading && quizzes.length === 0 && (
      <p className="text-white/90">
        Nema kvizova za ovaj predmet.
      </p>
    )}
  </div>
);


}