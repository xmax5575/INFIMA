export default function MultipleChoiceEditor({ question, onChange }) {
  return (
    <div className="space-y-3">
      {question.options.map((opt) => (
        <div key={opt.id} className="flex items-center gap-3">
          <input
            type="radio"
            checked={question.correctAnswer === opt.id}
            onChange={() => onChange({ correctAnswer: opt.id })}
            className="accent-[#3674B5]"
          />
          <input
            value={opt.text}
            onChange={(e) =>
              onChange({
                options: question.options.map((o) =>
                  o.id === opt.id ? { ...o, text: e.target.value } : o
                ),
              })
            }
            placeholder="Opcija odgovora"
            className="flex-1 rounded-xl border border-white/60 bg-white px-3 py-2 text-[#215993] placeholder:text-[#3674B5]/50 focus:outline-none focus:ring-2 focus:ring-[#3674B5]"
          />
        </div>
      ))}
      <button
        onClick={() =>
          onChange({
            options: [...question.options, { id: Date.now(), text: "" }],
          })
        }
        className="text-sm font-medium text-[#3674B5] hover:underline"
      >
        + Dodaj opciju
      </button>
    </div>
  );
}
