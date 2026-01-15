const TrueFalseDisplay = ({ text, correctAnswer }) => (
  <div className="space-y-3">
    <p className="text-white font-medium">{text}</p>
    <div className="flex gap-2">
      {['true', 'false'].map((val) => {
        const isCorrect = String(correctAnswer) === val;
        return (
          <div key={val} className={`flex-1 py-2 text-center rounded-lg border shadow-sm ${
            isCorrect ? "bg-green-500/40 border-green-400 text-white font-bold" : "bg-white/5 border-white/10 text-white/40"
          }`}>
            {val === 'true' ? "Točno" : "Netočno"}
          </div>
        );
      })}
    </div>
  </div>
);

export default TrueFalseDisplay;