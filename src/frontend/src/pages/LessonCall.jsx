import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api";
import JaasMeeting from "../components/JaasMeeting";

export default function LessonCall({ user }) {
  const { lessonId } = useParams();
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

  if (error) return <p className="text-red-600">{error}</p>;
  if (!meeting) return <p>Učitavanje meetinga…</p>;

  return (
    <JaasMeeting
      appId={meeting.appId}
      roomName={meeting.roomName}
      jwt={meeting.jwt}
    />
  );
}
