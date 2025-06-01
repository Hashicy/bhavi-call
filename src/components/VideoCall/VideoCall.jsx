import React, { useEffect, useRef, useState } from "react";
import Peer from "peerjs";
import "./VideoCall.css";

function VideoCall({ theme }) {
  const [myPeerId, setMyPeerId] = useState("");
  const [remoteId, setRemoteId] = useState("");
  const [callAccepted, setCallAccepted] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [stickers, setStickers] = useState([]);

  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerRef = useRef(null);
  const currentCall = useRef(null);
  const stickersRef = useRef([]);

  // Set stickers based on theme
  useEffect(() => {
    let newStickers = [];
    if (theme === "cute") {
      newStickers = ["sun", "star", "nora", "blue"];
    } else if (theme === "emo") {
      newStickers = ["moon", "nita", "skull", "yellow"];
    }
    // Create objects for each sticker with position & velocity
    setStickers(
      newStickers.map((name) => ({
        name,
        x: Math.random() * (window.innerWidth - 100),
        y: Math.random() * (window.innerHeight - 100),
        vx: (Math.random() - 0.5) * 2, // velocity x
        vy: (Math.random() - 0.5) * 2, // velocity y
        size: 80 + Math.random() * 50, // size between 80 and 130 px
      }))
    );
  }, [theme]);
const toggleMute = () => {
  if (localStream) {
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsMuted(!isMuted);
  }
};

  // Animate stickers bouncing inside viewport
  useEffect(() => {
    let animationFrameId;

    function animate() {
      setStickers((oldStickers) => {
        return oldStickers.map((sticker) => {
          let { x, y, vx, vy, size } = sticker;

          x += vx;
          y += vy;

          // Bounce on left/right edges
          if (x < 0) {
            x = 0;
            vx = -vx;
          } else if (x + size > window.innerWidth) {
            x = window.innerWidth - size;
            vx = -vx;
          }

          // Bounce on top/bottom edges
          if (y < 0) {
            y = 0;
            vy = -vy;
          } else if (y + size > window.innerHeight) {
            y = window.innerHeight - size;
            vy = -vy;
          }

          return { ...sticker, x, y, vx, vy };
        });
      });

      animationFrameId = requestAnimationFrame(animate);
    }

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  useEffect(() => {
    const peer = new Peer();
    peer.on("open", (id) => setMyPeerId(id));
    peer.on("call", (call) => setIncomingCall(call));
    peerRef.current = peer;

    return () => peer.destroy();
  }, []);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const startStream = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    setLocalStream(stream);
    return stream;
  };

  const acceptCall = async () => {
    const stream = await startStream();
    incomingCall.answer(stream);
    incomingCall.on("stream", (remoteStream) => {
      setRemoteStream(remoteStream);
      setCallAccepted(true);
    });
    currentCall.current = incomingCall;
    setIncomingCall(null);
  };

  const makeCall = async () => {
    if (!remoteId.trim()) return alert("Please enter remote peer ID");
    const stream = await startStream();
    const call = peerRef.current.call(remoteId, stream);
    call.on("stream", (remoteStream) => {
      setRemoteStream(remoteStream);
      setCallAccepted(true);
    });
    currentCall.current = call;
  };

  const endCall = () => {
    currentCall.current?.close();
    window.location.reload();
  };

  return (
    <div className={`video-call-wrapper ${theme}`}>
      <div className="my-id">
        Your ID: <code>{myPeerId}</code>
      </div>

      {!callAccepted && !incomingCall && (
        <div className="call-popup">
          <input
            type="text"
            placeholder="Enter remote peer ID"
            value={remoteId}
            onChange={(e) => setRemoteId(e.target.value)}
          />
          <button className="accept" onClick={makeCall}>
            📞 Call
          </button>
        </div>
      )}

      {incomingCall && (
        <div className="call-popup">
          <p>📞 Incoming call from someone</p>
          <div className="call-buttons">
            <button className="accept" onClick={acceptCall}>
              Accept
            </button>
            <button className="decline" onClick={() => setIncomingCall(null)}>
              Decline
            </button>
          </div>
        </div>
      )}

      {(callAccepted || localStream) && (
        <div className="call-screen">
          <button className="mute-toggle" onClick={toggleMute}>
  {isMuted ? "🎙️ Unmute" : "🔇 Mute"}
</button>

          {callAccepted && (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="remote-video"
            />
          )}
          {localStream && (
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="local-video"
            />
          )}

          {callAccepted && (
            <button className="end-call" onClick={endCall}>
              ❌ End Call
            </button>
          )}
        </div>
      )}

      {/* Floating stickers container */}
      <div className="floating-stickers">
       {stickers.map(({ name, x, y }, i) => (
  <img
    key={i}
    src={`/stickers/${name}.png`}
    alt={name}
    className="sticker"
    style={{
      position: "fixed",
      left: x,
      top: y,
      userSelect: "none",
      pointerEvents: "none",
      transform: "scale(0.3)", 
      transformOrigin: "top left",
    }}
    draggable={false}
  />
))}

      </div>
    </div>
  );
}

export default VideoCall;
