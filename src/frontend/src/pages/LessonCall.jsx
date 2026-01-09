import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api";
import JitsiMeeting from "../components/JitsiMeeting";

export default function LessonCall({ user }) {
  const { lessonId } = useParams();
  const [room, setRoom] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get(`/api/lessons/${lessonId}/jitsi/`)
      .then((res) => {
        setRoom(res.data.room);
      })
      .catch((err) => {
        setError(
          err.response?.data?.error ??
          "Ne mogu otvoriti meeting"
        );
      });
  }, [lessonId]);

  if (error) {
    return <p className="text-red-600">{error}</p>;
  }

  if (!room) {
    return <p>Učitavanje meetinga…</p>;
  }

  return (
    <JitsiMeeting
      roomName={room}
      displayName={`${user?.first_name ?? ""} ${user?.last_name ?? ""}`}
    />
  );
}