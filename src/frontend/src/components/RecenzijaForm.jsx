import React, { useState } from "react";
import { Star } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";

export default function RecenzijaForm() {
  const { lessonId } = useParams();
  const [rating, setRating] = useState(0);
  const [description, setDescription] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();


  const submitReview = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await api.post(`/api/reviews/${lessonId}/submit/`, {
        rating,
        description ,
      });

      navigate(res.data.redirect_to); 
    } catch (err) {
      setError("Neuspjelo slanje recenzije.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto rounded-3xl bg-[#D1F8EF] p-8">
      <form
        onSubmit={submitReview}
        className="rounded-2xl bg-white/70 p-6 space-y-6"
      >
        {/* NASLOV */}
        <h2 className="text-center text-2xl sm:text-3xl font-semibold text-[#215993]">
          Ostavi recenziju
        </h2>
         {error && <p className="text-red-600 mb-4">{error}</p>}

        {/* OCJENA */}
        <div>
          <div className="mb-2 text-sm sm:text-base font-semibold text-[#3674B5]">
            Ocjena
          </div>

          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setRating(v)}
                className="group"
              >
                <Star
                  className={`h-8 w-8 transition
                    ${
                      v <= rating
                        ? "text-[#3674B5] fill-[#3674B5]"
                        : "text-[#3674B5]/40"
                    }
                    group-hover:scale-110`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* KOMENTAR */}
        <div>
          <div className="mb-2 text-sm sm:text-base font-semibold text-[#3674B5]">
            Komentar
          </div>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Podijeli svoje iskustvo..."
            className="w-full resize-none rounded-xl border border-white/60 bg-white px-4 py-3 text-[#215993] placeholder:text-[#3674B5]/50 focus:outline-none focus:ring-2 focus:ring-[#3674B5]"
          />
        </div>

        {/* SUBMIT */}
        <button
          type="submit"
          disabled={!rating || loading}
          className="w-full rounded-xl bg-[#215993] px-4 py-3 font-semibold text-[#D1F8EF] hover:brightness-110 disabled:opacity-40"
            
        >
          {loading ? "Spremanje..." : "Pošalji recenziju"}
        </button>
      </form>
    </div>
  );
}
