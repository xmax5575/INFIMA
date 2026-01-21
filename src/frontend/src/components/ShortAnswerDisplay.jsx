const ShortAnswerDisplay = ({ text, correctAnswer }) => (
  <div className="space-y-3">
    <p className="text-white font-medium">{text}</p>
    <div className="p-3 bg-black/20 rounded-xl border border-white/10">
      <span className="text-xs text-white/50 block mb-1">Priznati odgovori:</span>
      <div className="flex flex-wrap gap-2">
        <span className="text-green-300 font-bold">{correctAnswer}</span>
      </div>
    </div>
  </div>
);

export default ShortAnswerDisplay;