export const ShortAnswerDisplay = ({ text, correctAnswer }) => (
  <div className="space-y-3">
    <p className="text-white font-medium">{text}</p>
    <div className="p-3 bg-black/20 rounded-xl border border-white/10">
      <span className="text-xs text-white/50 block mb-1">Priznati odgovori:</span>
      <div className="flex flex-wrap gap-2">
        {Array.isArray(correctAnswer) ? correctAnswer.map((ans, i) => (
          <span key={i} className="bg-green-500/40 px-3 py-1 rounded-md text-white text-sm border border-green-400/30">
            {ans}
          </span>
        )) : <span className="text-green-300 font-bold">{correctAnswer}</span>}
      </div>
    </div>
  </div>
);