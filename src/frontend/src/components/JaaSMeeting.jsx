import { JaaSMeeting } from "@jitsi/react-sdk";

export default function JaasMeeting({ appId, roomName, jwt, onMeetingEnd }) {
  return (
    <div style={{ width: "100%", height: "80vh" }}>
      <JaaSMeeting
        appId={appId}
        roomName={roomName}
        jwt={jwt}
        getIFrameRef={(node) => {
          if (node) node.style.height = "100%";
        }}
        onReadyToClose={() => {
          if (onMeetingEnd) {
            onMeetingEnd();
          }
        }}
      />
    </div>
  );
}
