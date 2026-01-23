const MultipleChoiceDisplay = ({ text, correctAnswer, options }) => (
  <div className="space-y-3">
    <p className="text-white font-medium">{text}</p>
    <div className="grid gap-2">
      {options.map((opt, index) => {
        const isCorrect = opt === correctAnswer;
        return (
          <div key={index} className={`p-3 rounded-xl border flex items-center gap-3 ${
            isCorrect ? "bg-green-500/30 border-green-400 text-white" : "bg-white/5 border-white/10 text-white/70"
          }`}>
            <div className={`w-2 h-2 rounded-full ${isCorrect ? "bg-green-400" : "bg-white/20"}`} />
            {opt}
          </div>
        );
      })}
    </div>
  </div>
);

export default MultipleChoiceDisplay;