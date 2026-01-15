import { useState, useEffect } from "react";
import api from "../api";

export default function QuizSolve({ questions, subject }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [finished, setFinished] = useState(false);

  const currentQuestion = questions[currentIndex];

  if (!questions || questions.length === 0) {
    return <p>Nema pitanja.</p>;
  }

  const saveAnswer = (value) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };

  const next = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((i) => i + 1);
    } else {
      setFinished(true);
    }
  };

  const isCorrect = (q) => {
    const user = answers[q.id];

    if (user == null) return false;

    if (q.type === "short_answer") {
      return (
        typeof user === "string" &&
        user.trim().toLowerCase() === q.correct_answer.trim().toLowerCase()
      );
    }

    return user === q.correct_answer;
  };

  const correctCount = questions.filter(isCorrect).length;
  useEffect(() => {
  if (!finished) return;

  const percentage = (correctCount / questions.length) * 100;

  let action = null;
 
  if (percentage > 90) action = "upgrade";
  else if (percentage < 40) action = "downgrade";
     console.log("ono sta saljem: ", action, percentage, subject)
  if (!action) return;

  api.post("/api/student/knowledge/", {
    subject: subject,
    action: action,
  });
}, [finished]);


  if (finished) {
    return (
      <div className="bg-white p-6 rounded-2xl space-y-4">
        <h2 className="text-xl font-bold text-[#215993]">
          Rezultat: {correctCount} / {questions.length}
        </h2>

        {questions.map((q, i) => (
          <div key={q.id} className="border rounded-xl p-4">
            <p className="font-semibold">
              {i + 1}. {q.text}
            </p>

            <p>
              Tvoj odgovor: <b>{String(answers[q.id] ?? "—")}</b>
            </p>

            <p>
              Točan odgovor: <b>{String(q.correct_answer)}</b>
            </p>

            <p
              className={
                isCorrect(q)
                  ? "text-green-600 font-semibold"
                  : "text-red-600 font-semibold"
              }
            >
              {isCorrect(q) ? "Točno" : "Netočno"}
            </p>
          </div>
        ))}
      </div>
    );
  }

  /* =======================
     PITANJE
  ======================= */
  return (
    <div className="bg-white p-6 rounded-2xl space-y-6">
      <h2 className="text-lg font-semibold text-[#215993]">
        {currentIndex + 1}. {currentQuestion.text}
      </h2>

      {/* TRUE / FALSE */}
      {currentQuestion.type === "true_false" && (
        <div className="flex gap-4">
          {[true, false].map((v) => {
            const active = answers[currentQuestion.id] === v;
            return (
              <button
                key={v.toString()}
                onClick={() => saveAnswer(v)}
                className={`px-4 py-2 rounded-xl font-semibold
                  ${
                    active
                      ? "bg-[#3674B5] text-white"
                      : "bg-gray-100 text-[#215993]"
                  }`}
              >
                {v ? "Točno" : "Netočno"}
              </button>
            );
          })}
        </div>
      )}

      {/* MULTIPLE CHOICE */}
      {currentQuestion.type === "multiple_choice" && (
        <div className="space-y-2">
          {currentQuestion.options.map((opt) => {
            const active = answers[currentQuestion.id] === opt;
            return (
              <button
                key={opt}
                onClick={() => saveAnswer(opt)}
                className={`block w-full text-left px-4 py-2 rounded-xl
                  ${
                    active
                      ? "bg-[#3674B5] text-white"
                      : "bg-gray-100 text-[#215993]"
                  }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}

      {/* SHORT ANSWER */}
      {currentQuestion.type === "short_answer" && (
        <input
          type="text"
          placeholder="Upiši odgovor"
          value={answers[currentQuestion.id] || ""}
          onChange={(e) => saveAnswer(e.target.value)}
          className="w-full border rounded-xl px-4 py-2"
        />
      )}

      <button
        onClick={next}
        disabled={answers[currentQuestion.id] == null}
        className="w-full bg-[#215993] text-white py-3 rounded-xl disabled:opacity-40"
      >
        {currentIndex + 1 === questions.length ? "Završi kviz" : "Dalje"}
      </button>
    </div>
  );
}
