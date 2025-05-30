import React, { useState } from "react";
import PomodoroTimer from "./components/PomodoroTimer/PomodoroTimer.jsx";
import "./App.css"; 

function App() {
  const [theme, setTheme] = useState("cute");

  const toggleTheme = () => {
    setTheme((prev) => (prev === "cute" ? "emo" : "cute"));
  };

  return (
    <div className={`App ${theme}`}>
      <button onClick={toggleTheme} className="theme-toggle">
        Switch to {theme === "cute" ? "Emo 🖤" : "Cute 🌸"}
      </button>
      <PomodoroTimer theme={theme} />
    </div>
  );
}

export default App;
