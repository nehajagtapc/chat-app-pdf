import React, { useState } from "react";

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [feedbackType, setFeedbackType] = useState("UI");

  const togglePanel = () => setIsOpen(!isOpen);

  const handleScreenshot = (e) => {
    if (e.target.files[0]) {
      setScreenshot(e.target.files[0]);
    }
  };

  return (
    <>
      {/* Floating Industrial Feedback Icon */}
      <div
        style={{
          ...styles.iconContainer,
          backgroundColor: isOpen ? "#E74C3C" : "#2E3B4E",
        }}
        onClick={togglePanel}
        title={isOpen ? "Close Feedback" : "Give Feedback"}
      >
        {isOpen ? "✖" : "💬"}
      </div>

      {/* Feedback Panel */}
      <div
        style={{
          ...styles.panel,
          transform: isOpen ? "translateY(0)" : "translateY(120%)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
        }}
      >
        <h4 style={styles.title}>Feedback</h4>

        {/* Feedback Type Dropdown */}
        <select
          style={styles.select}
          value={feedbackType}
          onChange={(e) => setFeedbackType(e.target.value)}
        >
          <option value="UI">UI</option>
          <option value="Bug">Bug</option>
          <option value="Others">Others</option>
        </select>

        {/* Screenshot Upload */}
        <input
          type="file"
          accept="image/*"
          onChange={handleScreenshot}
          style={styles.fileInput}
        />
        {screenshot && <p style={styles.screenshotName}>{screenshot.name}</p>}

        {/* Feedback Textarea */}
        <textarea
          style={styles.textarea}
          placeholder="Write your feedback here..."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
        />

        <button style={styles.button} disabled>
          Send Feedback
        </button>
        <p style={styles.note}>Sending disabled in this demo.</p>
      </div>
    </>
  );
}

// ---------- STYLES ----------
const styles = {
  iconContainer: {
    position: "fixed",
    bottom: 20,
    right: 20,
    width: 45,
    height: 45,
    borderRadius: "50%",
    color: "#fff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    fontSize: 20,
    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
    zIndex: 1000,
    transition: "background-color 0.3s ease",
  },
  panel: {
    position: "fixed",
    bottom: 75,
    right: 20,
    width: 300,
    padding: 15,
    borderRadius: 8,
    backgroundColor: "#fff",
    boxShadow: "0 4px 15px rgba(0,0,0,0.35)",
    zIndex: 1000,
    transition: "all 0.3s ease",
    color: "#000",
  },
  title: {
    margin: 0,
    marginBottom: 8,
    fontSize: 16,
    fontWeight: "600",
  },
  select: {
    width: "100%",
    padding: 6,
    marginBottom: 10,
    borderRadius: 5,
    border: "1px solid #ccc",
    fontSize: 14,
    cursor: "pointer",
  },
  fileInput: {
    marginBottom: 10,
  },
  screenshotName: {
    fontSize: 12,
    marginBottom: 10,
    color: "#555",
  },
  textarea: {
    width: "92%",
    height: 80,
    marginBottom: 10,
    borderRadius: 5,
    border: "1px solid #ccc",
    padding: 8,
    resize: "none",
    background: "#fff",
    color: "#000",
    fontSize: 14,
  },
  button: {
    width: "100%",
    padding: "8px 0",
    background: "#4A90E2",
    color: "#fff",
    border: "none",
    borderRadius: 5,
    cursor: "not-allowed",
    fontWeight: "600",
    fontSize: 14,
  },
  note: {
    marginTop: 6,
    fontSize: 11,
    color: "#555",
    textAlign: "center",
  },
};
