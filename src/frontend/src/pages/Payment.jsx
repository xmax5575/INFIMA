import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api";
import { useEffect, useState } from "react";

export default function Payment() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const sessionId = sp.get("session_id");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  
  useEffect(() => {
    if (!sessionId) return;
    const complete = async () => {
      setLoading(true);
      setError(null);
      try {

        await api.post(`/api/payments/${lessonId}/complete/`, { session_id: sessionId });
        navigate(`/review/${lessonId}`);
      } catch (err) {
        if (err?.response?.status === 403) navigate("/home/student", { replace: true });
  else setError("Plaćanje nije uspjelo.");
      } finally {
        setLoading(false);
      }
    };

    complete();
  }, [sessionId, lessonId, navigate]);

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

      {sessionId && <p className="mb-4 text-sm opacity-80">Potvrđujem plaćanje...</p>}
      {error && <p className="text-red-600 mb-4">{error}</p>}

      <button
        onClick={handlePayment}
        disabled={loading || !!sessionId}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-60"
      >
        {loading ? "Obrada..." : sessionId ? "Potvrđujem..." : "Plati"}
      </button>
    </div>
  );
}
