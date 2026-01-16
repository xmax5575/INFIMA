export default function ShortAnswerEditor({ question, onChange }) {
  return (
    <input
      value={question.correctAnswer || ""}
      onChange={(e) => onChange({ correctAnswer: e.target.value })}
      placeholder="Točan odgovor"
      className="w-full rounded-xl border border-white/60 bg-white px-4 py-3 text-[#215993] focus:outline-none focus:ring-2 focus:ring-[#3674B5]"
    />
  );
}
