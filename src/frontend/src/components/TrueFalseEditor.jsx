export default function TrueFalseEditor({ question, onChange }) {
  return (
    <div className="flex gap-4">
      <label  className="flex items-center gap-2 text-[#215993]">
        <input
          type="radio"
          checked={question.correctAnswer === true}
          onChange={() => onChange({ correctAnswer: true })}
           className="accent-[#3674B5]"
           
        />
        Točno
      </label>

      <label  className="flex items-center gap-2 text-[#215993]">
        <input
          type="radio"
          checked={question.correctAnswer === false}
          onChange={() => onChange({ correctAnswer: false })}
           className="accent-[#3674B5]"
        />
        Netočno
      </label>
    </div>
  );
}
