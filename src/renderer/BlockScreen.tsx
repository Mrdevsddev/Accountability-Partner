// D:/Accountiblity partner/src/renderer/BlockScreen.tsx
import React from "react";

export default function BlockScreen() {
  const handleUnlock = () => {
    if (window.electronAPI) {
      window.electronAPI.unlockApp();
    } else {
      console.warn("Electron API not found. Simulation: unlocking.");
    }
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      width: "100vw",
      height: "100vh",
      backgroundColor: "#0a0a0c",
      color: "#ffffff",
      userSelect: "none"
    }}>
      <div style={{
        textAlign: "center",
        padding: "40px",
        borderRadius: "24px",
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        backdropFilter: "blur(16px)",
        boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)"
      }}>
        <h1 style={{
          fontSize: "2.5rem",
          margin: "0 0 10px 0",
          fontWeight: 800,
          background: "linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent"
        }}>
          Curfew Check-In
        </h1>
        <p style={{
          fontSize: "1rem",
          color: "rgba(255, 255, 255, 0.6)",
          margin: "0 0 30px 0"
        }}>
          Complete your accountability report to unlock this PC.
        </p>
        <button
          onClick={handleUnlock}
          style={{
            padding: "12px 32px",
            fontSize: "1rem",
            fontWeight: 600,
            color: "#000000",
            backgroundColor: "#ffffff",
            border: "none",
            borderRadius: "12px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: "0 4px 14px 0 rgba(255, 255, 255, 0.2)"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "scale(1.03)";
            e.currentTarget.style.boxShadow = "0 6px 20px 0 rgba(255, 255, 255, 0.3)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 4px 14px 0 rgba(255, 255, 255, 0.2)";
          }}
        >
          Check In Now
        </button>
      </div>
    </div>
  );
}
