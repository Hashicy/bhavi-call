import React, { useEffect, useRef, useState } from "react";
import Peer from "peerjs";
import YouTube from "react-youtube";
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

  const [ytVideoId, setYtVideoId] = useState("");
  const [isWatching, setIsWatching] = useState(false);

  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerRef = useRef(null);
  const currentCall = useRef(null);
  const ytPlayerRef = useRef(null);
  const dataConnection = useRef(null);

  // Theme-based stickers animation - unchanged
  useEffect(() => {
    let newStickers = [];
    if (theme === "cute") {
      newStickers = ["sun", "star", "nora", "blue"];
    } else if (theme === "emo") {
      newStickers = ["moon", "nita", "skull", "yellow"];
    }
    setStickers(
      newStickers.map((name) => ({
        name,
        x: Math.random() * (window.innerWidth - 100),
        y: Math.random() * (window.innerHeight - 100),
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: 80 + Math.random() * 50,
      }))
    );
  }, [theme]);

  // Stickers animation - unchanged
  useEffect(() => {
    let animationFrameId;

    function animate() {
      setStickers((oldStickers) =>
        oldStickers.map((sticker) => {
          let { x, y, vx, vy, size } = sticker;
          x += vx;
          y += vy;

          if (x < 0 || x + size > window.innerWidth) vx = -vx;
          if (x < 0) x = 0;
          if (x + size > window.innerWidth) x = window.innerWidth - size;

          if (y < 0 || y + size > window.innerHeight) vy = -vy;
          if (y < 0) y = 0;
          if (y + size > window.innerHeight) y = window.innerHeight - size;

          return { ...sticker, x, y, vx, vy };
        })
      );
      animationFrameId = requestAnimationFrame(animate);
    }

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Toggle mute local audio
  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  // Send data only if connection is open
  const sendToPeer = (data) => {
    if (dataConnection.current?.open) {
      dataConnection.current.send(data);
    }
  };

  // Initialize Peer, setup handlers
  useEffect(() => {
    const peer = new Peer();
    peerRef.current = peer;

    peer.on("open", (id) => setMyPeerId(id));

    peer.on("call", (call) => {
      setIncomingCall(call);
    });

    peer.on("connection", (conn) => {
      dataConnection.current = conn;
      conn.on("data", (data) => {
        if (data.type === "video") {
          // Defensive check for valid video ID format
          if (typeof data.videoId === "string" && data.videoId.length === 11) {
            setYtVideoId(data.videoId);
            setIsWatching(true);
          }
        } else if (data.type === "yt-state" && ytPlayerRef.current) {
          const player = ytPlayerRef.current;
          if (data.state === 1) player.playVideo();
          else if (data.state === 2) player.pauseVideo();
        }
      });
    });

    return () => {
      peer.destroy();
      setCallAccepted(false);
      setIncomingCall(null);
      dataConnection.current = null;
    };
  }, []);

  // Update remote video element's stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Update local video element's stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Get user media stream
  const startStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      return stream;
    } catch (err) {
      alert("Error accessing media devices.");
      throw err;
    }
  };

  // Accept incoming call
  const acceptCall = async () => {
    if (!incomingCall) return;
    try {
      const stream = await startStream();
      incomingCall.answer(stream);
      incomingCall.on("stream", (remoteStream) => {
        setRemoteStream(remoteStream);
        setCallAccepted(true);
      });
      currentCall.current = incomingCall;
      setIncomingCall(null);
    } catch (e) {
      console.error(e);
    }
  };

  // Make outgoing call
const makeCall = async () => {
  if (!remoteId.trim()) {
    return alert("Please enter remote peer ID");
  }

  const confirmed = window.confirm(`Do you want to call this peer?\nID: ${remoteId}`);
  if (!confirmed) return;

  try {
    const stream = await startStream();
    const call = peerRef.current.call(remoteId, stream);
    call.on("stream", (remoteStream) => {
      setRemoteStream(remoteStream);
      setCallAccepted(true);
    });
    const conn = peerRef.current.connect(remoteId);
    dataConnection.current = conn;
    currentCall.current = call;
  } catch (e) {
    alert("Failed to make a call.");
    console.error(e);
  }
};


  // End current call
  const endCall = () => {
    currentCall.current?.close();
    window.location.reload();
  };

  // Validate YouTube video ID (simple regex)
  const isValidYouTubeId = (id) => /^[a-zA-Z0-9_-]{11}$/.test(id);

  // Handle watch together button click
  const handleWatchTogether = () => {
    if (!isValidYouTubeId(ytVideoId)) {
      alert("Please enter a valid 11-character YouTube video ID.");
      return;
    }
    setIsWatching(true);
    sendToPeer({ type: "video", videoId: ytVideoId });
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

      {/* Floating stickers */}
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

      {/* Watch Together YouTube */}
      {callAccepted && (
        <div className="youtube-watch">
          {!isWatching ? (
            <div className="youtube-input">
              <input
                type="text"
                placeholder="YouTube video ID (e.g. dQw4w9WgXcQ)"
                value={ytVideoId}
                onChange={(e) => setYtVideoId(e.target.value)}
              />
              <button onClick={handleWatchTogether}>▶️ Watch Together</button>
            </div>
          ) : (
            <div className="youtube-player-wrapper">
  <YouTube
    videoId={ytVideoId}
    onReady={(e) => (ytPlayerRef.current = e.target)}
    onStateChange={(e) => {
      sendToPeer({ type: "yt-state", state: e.data });
    }}
    onError={(e) => {
      alert(
        "YouTube Playback error. Please check the video ID or try a different video."
      );
      setIsWatching(false);
    }}
    opts={{
      width: "360",
      height: "240",
      playerVars: {
        autoplay: 0,
        origin: window.location.origin,
      },
    }}
  />
  <button
    className="quit-watch"
    onClick={() => {
      setIsWatching(false);
      setYtVideoId("");
      sendToPeer({ type: "yt-state", state: 2 }); // Pause remote video
    }}
  >
    ❌ Quit
  </button>
</div>

          )}
        </div>
      )}
    </div>
  );
}

export default VideoCall;
