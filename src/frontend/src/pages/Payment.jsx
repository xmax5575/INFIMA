import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import { useState } from "react";

export default function Payment() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

    const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
        const res = await api.post(`/api/payments/${lessonId}/confirm/`);
        window.location.href = res.data.checkout_url; 
    } catch (err) {
        setError("Plaćanje nije uspjelo.");
    } finally {
        setLoading(false);
    }
    };


  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded">
      <h1 className="text-2xl font-bold mb-4">Plaćanje instrukcija</h1>

      <p className="mb-6">
        Lekcija ID: <strong>{lessonId}</strong>
      </p>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <button
        onClick={handlePayment}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        {loading ? "Obrada..." : "Plati"}
      </button>
    </div>
  );
}