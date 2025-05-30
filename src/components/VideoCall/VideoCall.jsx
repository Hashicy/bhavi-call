import React, { useEffect, useRef, useState } from "react";
import Peer from "peerjs";
import "./VideoCall.css";

function VideoCall({ theme }) {
  const [myPeerId, setMyPeerId] = useState("");
  const [remoteId, setRemoteId] = useState("");
  const [callAccepted, setCallAccepted] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [localStream, setLocalStream] = useState(null);  // <-- new local stream state

  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerRef = useRef(null);
  const currentCall = useRef(null);

  // Update remote video srcObject when remoteStream changes
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Update local video srcObject when localStream changes
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    const peer = new Peer();

    peer.on("open", (id) => {
      setMyPeerId(id);
    });

    peer.on("call", (call) => {
      setIncomingCall(call);
    });

    peerRef.current = peer;

    return () => {
      peer.destroy();
    };
  }, []);

  // Start camera/mic stream and save to state
  const startStream = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    setLocalStream(stream);
    return stream;
  };

  // Accept incoming call and answer with local stream
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

  // Make outgoing call and set remote stream when received
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

  // End the call and reload
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
          {/* Show remote video only if call accepted and remote stream exists */}
          {callAccepted && (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="remote-video"
            />
          )}
          {/* Show local video anytime we have localStream */}
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
    </div>
  );
}

export default VideoCall;
