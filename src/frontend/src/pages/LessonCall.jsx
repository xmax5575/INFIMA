import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api";
import JaasMeeting from "../components/JaaSMeeting";

export default function LessonCall() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        // 1) dohvati room (tvoja postojeća logika)
        const r = await api.get(`/api/lessons/${lessonId}/jitsi/`);
        const room = r.data.room;

        // 2) dohvati JaaS JWT za taj room
        const t = await api.get(`/api/lessons/${lessonId}/jaas-token/`);

        setMeeting(t.data); // {appId, roomName, jwt}
      } catch (err) {
        setError(err.response?.data?.error ?? "Ne mogu otvoriti meeting");
      }
    })();
  }, [lessonId]);

  const handleMeetingEnd = async () => {
  try {
    await api.post(`/api/lessons/${lessonId}/end/`);

    const roleRes = await api.get("/api/user/role");
    const role = roleRes.data?.role;

    if (role === "INSTRUCTOR") {
      navigate(`/summary/${lessonId}`);
    } else {
      navigate(`/review/${lessonId}`);
    }
  } catch (err) {
    console.error(err);
    navigate("/");
  }
};


  if (error) return <p className="text-red-600">{error}</p>;
  if (!meeting) return <p>Učitavanje meetinga…</p>;

  return (
    <JaasMeeting
      appId={meeting.appId}
      roomName={meeting.roomName}
      jwt={meeting.jwt}
      onMeetingEnd={handleMeetingEnd}
    />
  );
}
