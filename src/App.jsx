import React, { useState } from "react";
import PomodoroTimer from "./components/PomodoroTimer/PomodoroTimer";

import "./App.css";
import VideoCall from "./components/VideoCall/VideoCall";

function App() {
  const [theme, setTheme] = useState("cute");
  const [fadeOut, setFadeOut] = useState(false);

  const toggleTheme = () => {
    setFadeOut(true);
    setTimeout(() => {
      setTheme((prev) => (prev === "cute" ? "emo" : "cute"));
      setFadeOut(false);
    }, 400);
  };

  return (
    <div className={`App ${theme} ${fadeOut ? 'fade-out' : ''}`}>
      <button onClick={toggleTheme} className="theme-toggle">
        Switch to {theme === "cute" ? "Emo 🖤" : "Cute 🌸"}
      </button>
      <PomodoroTimer theme={theme} fadeOut={fadeOut} />
    <VideoCall theme={theme}/>
    </div>
  );
}

export default App;
