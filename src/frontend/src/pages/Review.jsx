import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../api";

export default function Review() {
  const { lessonId } = useParams();
  const navigate = useNavigate();

  const [rating, setRating] = useState(5);
  const [description, setDescription] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const submitReview = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await api.post(`/api/reviews/${lessonId}/submit/`, {
        rating,
        description,
      });

      navigate(res.data.redirect_to); // /home/student
    } catch (err) {
      setError("Neuspjelo slanje recenzije.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded">
      <h1 className="text-2xl font-bold mb-4">Ostavi recenziju</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <label className="block mb-2 font-medium">Ocjena</label>
      <select
        value={rating}
        onChange={(e) => setRating(Number(e.target.value))}
        className="w-full mb-4 p-2 border rounded"
      >
        {[5, 4, 3, 2, 1].map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>

      <label className="block mb-2 font-medium">Komentar</label>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full p-2 border rounded mb-4"
        rows={4}
      />

      <button
        onClick={submitReview}
        disabled={loading}
        className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
      >
        {loading ? "Spremanje..." : "Pošalji recenziju"}
      </button>
    </div>
  );
}
