import React from "react";
import ChatInterface from "./components/ChatInterface";

function App() {
  return (
    <div style={{ maxWidth: 1455}}>

      {/* FULL BLUE HEADER */}
      <div style={{
        width: "100%",
        background: "#2764aaff",
        padding: "20px 30px",
        color: "white",
        fontSize: "15px",
        fontWeight: "bold",
        boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
      }}>
        AI SmartChat for PDFs
      </div>

      <ChatInterface />
    </div>
  );
}

export default App;
