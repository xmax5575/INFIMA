import { useState } from "react";
import QuestionEditor from "./QuestionEditor";
import api from "../api";

const SUBJECTS = ["Matematika", "Fizika", "Informatika"];
const SCHOOLS = ["Osnovna", "Srednja"];

const GRADES = {
  Osnovna: ["1", "2", "3", "4", "5", "6", "7", "8"],
  Srednja: ["1", "2", "3", "4"],
};

export default function QuizBuilder() {
  const [subject, setSubject] = useState("");
  const [school, setSchool] = useState("");
  const [grade, setGrade] = useState("");
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
    if (!subject) return "Molimo odaberite predmet.";
    if (!school) return "Molimo odaberite školu.";
    if (!grade) return "Molimo odaberite razred.";
    if (questions.length === 0) return "Dodajte barem jedno pitanje.";

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];

      if (!q.text.trim()) return `Pitanje ${i + 1} nema tekst pitanja.`;
      if (!q.type) return `Pitanje ${i + 1} nema odabran tip.`;
      if (!q.difficulty) return `Pitanje ${i + 1} nema odabranu težinu.`;

      if (q.type === "multiple_choice") {
        if (!q.options || q.options.length < 2) {
          return `Pitanje ${i + 1} mora imati barem dvije opcije.`;
        }
        if (!q.correctAnswer) {
          return `Pitanje ${i + 1} nema označen točan odgovor.`;
        }
        if (q.options.find((o) => !o.text.trim())) {
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

  const saveQuiz = async () => {
    const errorMessage = validateQuiz();
    if (errorMessage) {
      setError(errorMessage);
      return;
    }

    setError(null);

    const payload = {
      questions: questions.map((q) => {
        const baseQuestion = {
          subject,
          school_level: school.toLowerCase(), // "srednja" | "osnovna"
          grade: Number(grade),
          difficulty: q.difficulty, // ostaje "jako lagano"
          type: q.type,
          text: q.text,
        };

        if (q.type === "multiple_choice") {
          return {
            ...baseQuestion,
            options: q.options.map((o) => o.text),
            correct_answer: q.options.find((o) => o.id === q.correctAnswer)
              ?.text,
          };
        }

        if (q.type === "short_answer") {
          return {
            ...baseQuestion,
            correct_answer: q.correctAnswer,
          };
        }

        if (q.type === "true_false") {
          return {
            ...baseQuestion,
            correct_answer: q.correctAnswer, // true / false
          };
        }

        return baseQuestion;
      }),
    };

    console.log("PAYLOAD ZA BACKEND:", payload);

    try {
      const res = await api.post("/api/instructor/questions/upload/", payload);
      console.log("Uspješno spremljeno:", res.data);
      setSubject("");
  setSchool("");
  setGrade("");
  setQuestions([]);
  setError(null);
    } catch (error) {
      console.error(error);
      setError(error.response?.data?.message || "Greška pri spremanju pitanja");
    }
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
    <div
      className="
        w-full 
        max-w-4xl 
        mx-auto 
        bg-[#D1F8EF]
        rounded-2xl sm:rounded-3xl
        p-4 sm:p-8
        space-y-4 sm:space-y-6
      "
    >
      <h1 className="text-center text-2xl sm:text-3xl font-semibold text-[#215993]">
        Dodaj pitanja
      </h1>

      <h2 className="text-center text-sm sm:text-base text-[#215993]">
        Pomozite učenicima da bolje nauče gradivo i dodajte pitanja u bazu
      </h2>

      {/* FILTER KARTICA */}
      <div
        className="
          w-full
          max-w-xl sm:max-w-3xl
          mx-auto
          bg-white/70
          rounded-xl sm:rounded-2xl
          p-4 sm:p-6
          flex
          flex-col
          gap-3 sm:gap-4
          items-center
          sm:flex-row
          sm:items-end
          sm:justify-center
        "
      >
        {/* Predmet */}
        <div className="flex flex-col gap-1 w-full sm:w-auto">
          <label className="text-sm font-semibold text-[#3674B5]">
            Predmet
          </label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="
              w-full sm:w-48
              rounded-lg sm:rounded-xl
              border border-white/60
              bg-white
              px-3 sm:px-4
              py-2 sm:py-3
              text-sm sm:text-base
              text-[#215993]
              focus:outline-none focus:ring-2 focus:ring-[#3674B5]
            "
          >
            <option value="">Odaberi predmet</option>
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Škola */}
        <div className="flex flex-col gap-1 w-full sm:w-auto">
          <label className="text-sm font-semibold text-[#3674B5]">Škola</label>
          <select
            value={school}
            onChange={(e) => {
              setSchool(e.target.value);
              setGrade("");
            }}
            className="
              w-full sm:w-48
              rounded-lg sm:rounded-xl
              border border-white/60
              bg-white
              px-3 sm:px-4
              py-2 sm:py-3
              text-sm sm:text-base
              text-[#215993]
            "
          >
            <option value="">Odaberi školu</option>
            {SCHOOLS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Razred */}
        <div className="flex flex-col gap-1 w-full sm:w-auto">
          <label className="text-sm font-semibold text-[#3674B5]">Razred</label>
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            disabled={!school}
            className="
              w-full sm:w-48
              rounded-lg sm:rounded-xl
              border border-white/60
              bg-white
              px-3 sm:px-4
              py-2 sm:py-3
              text-sm sm:text-base
              text-[#215993]
              disabled:opacity-50
            "
          >
            <option value="">Odaberi razred</option>
            {school &&
              GRADES[school].map((g) => (
                <option key={g} value={g}>
                  {g}.
                </option>
              ))}
          </select>
        </div>
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
