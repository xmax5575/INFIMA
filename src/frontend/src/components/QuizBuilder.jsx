import { useState } from "react";
import QuestionEditor from "./QuestionEditor";
const SUBJECTS = ["Matematika", "Fizika", "Informatika"];

export default function QuizBuilder() {
  const [subject, setSubject] = useState("");

  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState(null);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: Date.now(),
        type: "multiple_choice",
        text: "",
        points: 1,
        difficulty: "jako lagano",
        options: [],
        correctAnswer: null,
      },
    ]);
  };
  const validateQuiz = () => {
    if (!subject) {
      return "Molimo odaberite predmet.";
    }

    if (questions.length === 0) {
      return "Dodajte barem jedno pitanje.";
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];

      if (!q.text.trim()) {
        return `Pitanje ${i + 1} nema tekst pitanja.`;
      }

      if (!q.type) {
        return `Pitanje ${i + 1} nema odabran tip.`;
      }

      if (!q.difficulty) {
        return `Pitanje ${i + 1} nema odabranu težinu.`;
      }

      if (q.type === "multiple_choice") {
        if (!q.options || q.options.length < 2) {
          return `Pitanje ${i + 1} mora imati barem dvije opcije.`;
        }

        if (!q.correctAnswer) {
          return `Pitanje ${i + 1} nema označen točan odgovor.`;
        }

        const emptyOption = q.options.find((o) => !o.text.trim());
        if (emptyOption) {
          return `Pitanje ${i + 1} ima praznu opciju odgovora.`;
        }
      }

      if (q.type === "true_false" && q.correctAnswer === null) {
        return `Pitanje ${i + 1} nema označeno točno / netočno.`;
      }

      if (q.type === "short_answer" && !q.correctAnswer?.trim()) {
        return `Pitanje ${i + 1} nema upisan točan odgovor.`;
      }
    }

    return null;
  };

  const saveQuiz = () => {
    const errorMessage = validateQuiz();

    if (errorMessage) {
      setError(errorMessage);
      return;
    }

    setError(null);

    const payload = {
      subject,
      questions,
    };

    console.log("SPREMANJE PITANJA:", payload);
  };

  const updateQuestion = (id, updated) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...updated } : q))
    );
  };

  const removeQuestion = (id) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl bg-[#D1F8EF] p-8 space-y-6">
      <h1 className="text-center text-3xl font-semibold text-[#215993]">
        Dodaj pitanja
      </h1>
      <h2 className="text-center text-[#215993]">Pomozite učenicima da bolje nauče gradivo i dodajte pitanja u bazu</h2>
      
      <div className="w-full max-w-sm mx-auto rounded-2xl bg-white/70 p-6 space-y-3 flex flex-col items-center">
        <label className="block text-sm font-semibold text-[#3674B5]">
          Predmet
        </label>

        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="rounded-xl border border-white/60 bg-white px-4 py-3 text-[#215993] focus:outline-none focus:ring-2 focus:ring-[#3674B5]"
        >
          <option value="">Odaberi predmet</option>
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {questions.map((q, index) => (
        <QuestionEditor
          key={q.id}
          index={index}
          question={q}
          onChange={(data) => updateQuestion(q.id, data)}
          onRemove={() => removeQuestion(q.id)}
        />
      ))}

      <button
        onClick={addQuestion}
        className="w-full rounded-xl bg-[#3674B5] px-4 py-3 font-semibold text-[#D1F8EF] hover:brightness-110"
      >
        Dodaj pitanje
      </button>
      {error && (
        <p className="text-sm text-red-600 font-medium text-center">{error}</p>
      )}

      <button
        onClick={saveQuiz}
        disabled={!subject || questions.length === 0}
        className="w-full rounded-xl bg-[#215993] px-4 py-3 font-semibold text-[#D1F8EF] hover:brightness-110 disabled:opacity-40 transition"
      >
        Spremi pitanja
      </button>
    </div>
  );
}
