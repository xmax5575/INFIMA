import { useEffect, useRef } from "react";

export default function JitsiMeeting({ roomName, displayName }) {
  const ref = useRef(null);

  useEffect(() => {
    const loadJitsi = () => {
      const api = new window.JitsiMeetExternalAPI("meet.jit.si", {
        roomName,
        parentNode: ref.current,
        userInfo: {
          displayName,
        },
      });

      return () => api.dispose();
    };

    if (!window.JitsiMeetExternalAPI) {
      const script = document.createElement("script");
      script.src = "https://meet.jit.si/external_api.js";
      script.onload = loadJitsi;
      document.body.appendChild(script);
    } else {
      loadJitsi();
    }
  }, [roomName, displayName]);

  return (
    <div
      ref={ref}
      style={{ width: "100%", height: "80vh" }}
    />
  );
}
