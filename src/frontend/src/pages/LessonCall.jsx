import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api";
import JaasMeeting from "../components/JaaSMeeting";
import LoadingPage from "./LoadingPage";

export default function LessonCall() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        await api.get(`/api/lessons/${lessonId}/jitsi/`);
        const t = await api.get(`/api/lessons/${lessonId}/jaas-token/`);
        setMeeting(t.data);
      } catch (err) {
        const status = err?.response?.status;

        if (status === 403) {
          navigate("/home/student", { replace: true });
          return;
        }

        setError("Ne mogu otvoriti meeting. Pokušaj ponovno.");
        console.error(err);
      }
    })();
  }, [lessonId, navigate]);

  const handleMeetingEnd = async () => {
    try {
      const response = await api.post(`/api/lessons/${lessonId}/end/`);
      console.log("END response:", response.data);

      const targetUrl = response.data?.redirect_to;
      console.log("redirect_to:", targetUrl);

      navigate(targetUrl || "/");
    } catch (err) {
      console.error("Greška pri završetku lekcije:", err?.response?.status, err?.response?.data);
      navigate("/");
    }
  };


  if (error) return <p className="text-red-600">{error}</p>;
  if (!meeting) return <LoadingPage />;

  return (
    <JaasMeeting
      appId={meeting.appId}
      roomName={meeting.roomName}
      jwt={meeting.jwt}
      onMeetingEnd={handleMeetingEnd}
    />
  );
}
