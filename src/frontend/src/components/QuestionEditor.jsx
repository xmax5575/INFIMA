import MultipleChoiceEditor from "./MultipleChoiceEditor";
import TrueFalseEditor from "./TrueFalseEditor";
import ShortAnswerEditor from "./ShortAnswerEditor";
export default function QuestionEditor({ question, index, onChange, onRemove }) {
  return (
    <div className="rounded-2xl bg-white/70 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#215993]">
          Pitanje {index + 1}
        </h3>

        <button
          onClick={onRemove}
          className="text-sm font-medium text-red-500 hover:underline"
        >
          Ukloni
        </button>
      </div>

      <textarea
        value={question.text}
        onChange={(e) => onChange({ text: e.target.value })}
        placeholder="Unesi tekst pitanja..."
        className="w-full resize-none rounded-xl border border-white/60 bg-white px-4 py-3 text-[#215993] placeholder:text-[#3674B5]/50 focus:outline-none focus:ring-2 focus:ring-[#3674B5]"
      />

      <div className="grid grid-cols-2 gap-4">
        <select
          value={question.type}
          onChange={(e) =>
            onChange({ type: e.target.value, options: [], correctAnswer: null })
          }
          className="rounded-xl border border-white/60 bg-white px-4 py-2 text-[#215993] focus:outline-none focus:ring-2 focus:ring-[#3674B5]"
        >
          <option value="multiple_choice">Multiple choice</option>
          <option value="true_false">True / False</option>
          <option value="short_answer">Short answer</option>
        </select>

        <select
          value={question.difficulty}
          onChange={(e) => onChange({ difficulty: e.target.value })}
          className="rounded-xl border border-white/60 bg-white px-4 py-2 text-[#215993] focus:outline-none focus:ring-2 focus:ring-[#3674B5]"
        >
          <option value="jako lagano">Jako lagano</option>
          <option value="lagano">Lagano</option>
          <option value="srednje">Srednje</option>
          <option value="teško">Teško</option>
          <option value="jako teško">Jako teško</option>
         
        </select>
      </div>
      {question.type === "multiple_choice" && (
        <MultipleChoiceEditor question={question} onChange={onChange} />
      )}

      {question.type === "true_false" && (
        <TrueFalseEditor question={question} onChange={onChange} />
      )}

      {question.type === "short_answer" && (
        <ShortAnswerEditor question={question} onChange={onChange} />
      )}
    </div>
  );
}
