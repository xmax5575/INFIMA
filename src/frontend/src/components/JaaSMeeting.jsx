import { JaaSMeeting } from "@jitsi/react-sdk";

export default function JaasMeeting({ appId, roomName, jwt }) {
  return (
    <div style={{ width: "100%", height: "80vh" }}>
      <JaaSMeeting
        appId={appId}
        roomName={roomName}
        jwt={jwt}
        getIFrameRef={(node) => (node.style.height = "100%")}
      />
    </div>
  );
}

