import React, { useState, useEffect, useRef } from "react";
import "./PomodoroTimer.css";

const PomodoroTimer = ({ theme }) => {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const timerRef = useRef(null);
  const pos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    let timer;
    if (isRunning) {
      timer = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            clearInterval(timer);
            const nextIsBreak = !isBreak;
            setIsBreak(nextIsBreak);
            setMinutes(nextIsBreak ? 5 : 25);
            setSeconds(0);
            setIsRunning(false);
          } else {
            setMinutes((m) => m - 1);
            setSeconds(59);
          }
        } else {
          setSeconds((s) => s - 1);
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, seconds, minutes, isBreak]);

  const handleStartPause = () => setIsRunning(!isRunning);
  const handleReset = () => {
    setIsRunning(false);
    setMinutes(isBreak ? 5 : 25);
    setSeconds(0);
  };

  // Drag handlers
  const handleMouseDown = (e) => {
    pos.current = {
      x: e.clientX - timerRef.current.offsetLeft,
      y: e.clientY - timerRef.current.offsetTop,
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e) => {
    timerRef.current.style.left = `${e.clientX - pos.current.x}px`;
    timerRef.current.style.top = `${e.clientY - pos.current.y}px`;
  };

  const handleMouseUp = () => {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      ref={timerRef}
      className={`pomodoro-container ${isBreak ? "break" : "focus"} ${theme}`}
      onMouseDown={handleMouseDown}
    >
      <h2>{isBreak ? "Break Time 🌸" : "Focus Time ✨"}</h2>
      <div className="timer">
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </div>
      <div className="buttons">
        <button onClick={handleStartPause}>{isRunning ? "Pause" : "Start"}</button>
        <button onClick={handleReset}>Reset</button>
      </div>
    </div>
  );
};

export default PomodoroTimer;
