import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import Feedback from "./Feedback"; // adjust the path if Feedback.jsx is in another folder
import { jsPDF } from "jspdf";
import { saveMessage, getMessages } from "./HistoryDB";

export default function ChatInterface() {
    const [docId, setDocId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [uploading, setUploading] = useState(false);
    const [uploadedName, setUploadedName] = useState("");
    // inside ChatInterface:
    const [isTyping, setIsTyping] = useState(false); // typing indicator
    const [chatHistory, setChatHistory] = useState([]);
    const [currentChatIndex, setCurrentChatIndex] = useState(null);


    const chatEndRef = useRef(null); // for auto-scroll

    const [userId] = useState(() => {
        let id = localStorage.getItem("userId");
        if (!id) {
            id = `user-${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem("userId", id);
        }
        return id;
    });

    const speak = (text) => {
        const speech = new SpeechSynthesisUtterance(text);
        speech.lang = "en-US";
        speech.rate = 1;
        window.speechSynthesis.speak(speech);
    };


    // ---------- UPLOAD PDF ----------
    const uploadPDF = async (file) => {
        if (!file) return;

        // Accept only PDF
        if (file.type !== "application/pdf") {
            setMessages(prev => [...prev, { from: "bot", text: "Only PDF files are allowed." }]);
            speak("Only PDF files are allowed.");
            return;
        }

        // Max size: 10 MB (file should be <= 10MB)
        const MAX_SIZE = 10 * 1024 * 1024; // 10MB in bytes
        if (file.size > MAX_SIZE) {
            setMessages(prev => [...prev, { from: "bot", text: "File size must be 10MB or less." }]);
            speak("File size must be 10MB or less.");
            return;
        }

        setUploading(true);

        const fd = new FormData();
        fd.append("file", file);

        try {
            const res = await axios.post(
                "http://127.0.0.1:8000/upload-pdf/",
                fd,
                { headers: { "Content-Type": "multipart/form-data" } }
            );

            const newDocId = res.data.doc_id;
            const totalPages = res.data.pages;

            // PDF must contain at minimun 10 pages
            if (totalPages > 10) {
                setMessages(prev => [
                    ...prev,
                    { from: "bot", text: "PDF must contain at least 10 pages." }
                ]);
                speak("PDF must contain at least 10 pages.");
                setUploading(false);
                return;
            }

            // SUCCESS
            setDocId(newDocId);
            setUploadedName(file.name);

            setMessages(prev => [
                ...prev,
                {
                    from: "bot",
                    text: `PDF: ${file.name} (✔)\nPages: ${totalPages} Uploaded successfully.`,
                },
            ]);

            speak(`PDF ${file.name}, Pages ${totalPages}, uploaded successfully.`);

        } catch (err) {
            console.log(err);
            setMessages(prev => [
                ...prev,
                { from: "bot", text: "Error uploading PDF" },
            ]);
        }

        setUploading(false);
    };


    // -------- Export Chat to PDF --------
    const exportChatToPDF = () => {
        const doc = new jsPDF();
        let yOffset = 10; // starting vertical position

        messages.forEach((msg, idx) => {
            const sender = msg.from === "user" ? "You: " : "Bot: ";
            const text = sender + msg.text;

            const splitText = doc.splitTextToSize(text, 180); // wrap text within 180px width
            doc.text(splitText, 10, yOffset);
            yOffset += splitText.length * 10; // add space between messages
        });

        doc.save("chat.pdf");
    };


    // ---------- SEND QUESTION ----------
    const sendMessage = async (overrideText = null) => {
        const messageToSend = overrideText || input;
        if (!messageToSend.trim()) return;

        // Show message in UI
        setMessages((prev) => [...prev, { from: "user", text: messageToSend }]);
        setInput("");

        // Save user message to MongoDB
        await saveMessage(userId, "user", messageToSend, docId, uploadedName);

        if (!docId) {
            const warning = "Please upload a PDF first.";
            setMessages((prev) => [...prev, { from: "bot", text: warning }]);
            await saveMessage(userId, "bot", warning, docId, uploadedName);
            return;
        }

        try {
            setIsTyping(true);
            const res = await axios.post("http://127.0.0.1:8000/query/", {
                doc_id: docId,
                question: messageToSend,
            });

            // Show bot answer
            setMessages((prev) => [...prev, { from: "bot", text: res.data.answer }]);

            // Save bot answer to MongoDB
            await saveMessage(userId, "bot", res.data.answer, docId, uploadedName);

            speak(res.data.answer);
        } catch (e) {
            const errorMsg = "Error fetching answer";
            setMessages((prev) => [...prev, { from: "bot", text: errorMsg }]);
            await saveMessage(userId, "bot", errorMsg);
        } finally {
            setIsTyping(false);
        }
    };



    // Speech to Text (Voice Input)
    const startListening = () => {
        const recognition = new (window.SpeechRecognition ||
            window.webkitSpeechRecognition)();

        recognition.lang = "en-US";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.start();

        recognition.onresult = (event) => {
            const voiceText = event.results[0][0].transcript;
            setInput(voiceText);
            sendMessageFromVoice(voiceText);
        };

        recognition.onerror = (err) => {
            console.log("Speech Error:", err);
        };
    };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        const fetchHistory = async () => {
            const history = await getMessages(userId); // fetch from backend
            setChatHistory(history);
        };
        fetchHistory();
    }, [userId]);

    // ---------- New Chat ----------
    const startNewChat = () => {
        // Only save current chat if it’s a new unsaved chat
        if (messages.length > 0 && currentChatIndex === null) {
            setChatHistory(prev => [...prev, { messages: messages || [], docId, uploadedName }]);
        }
        setMessages([]);
        setDocId(null);
        setUploadedName("");
        setCurrentChatIndex(null);
    };


    // ---------- Load chat from history ----------
    const loadChatFromHistory = (index) => {
        const chat = chatHistory[index];
        setMessages(chat.messages);
        setDocId(chat.docId);
        setUploadedName(chat.uploadedName);
        setCurrentChatIndex(index);
    };

    const sendMessageFromVoice = (msg) => {
        setMessages((prev) => [...prev, { from: "user", text: msg }]);
        setInput("");
        sendMessage(msg);
    };

    return (
        <div style={{ display: "flex", height: "85vh" }}>
            {/* Chat History Sidebar */}
            <div style={{ width: "250px", borderRight: "1px solid #ccc", padding: 10, overflowY: "auto" }}>
                <h3>Chat History</h3>
                <button onClick={startNewChat} style={{ marginBottom: 10, padding: "5px 10px" }}>+ New Chat</button>
                {(chatHistory || []).map((chat, idx) => (
                    <div
                        key={idx}
                        style={{ marginBottom: 5, cursor: "pointer" }}
                        onClick={() => loadChatFromHistory(idx)}
                    >
                        <b>{chat?.uploadedName || `Chat ${idx + 1}`}</b>
                        <div style={{ fontSize: 12, color: "#555" }}>
                            {chat?.messages && chat.messages.length > 0
                                ? chat.messages[0].text.slice(0, 30) + "..."
                                : "No messages yet"}
                        </div>
                    </div>
                ))}

            </div>



            {/* Main Chat Area */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", border: "1px solid #ddd", borderRadius: 10, background: "#fff" }}>

                {/* Upload Box */}
                <div style={styles.uploadBox}>
                    <div style={styles.uploadInner}>
                        <div style={styles.uploadIcon}>📤</div>
                        <p style={styles.uploadTitle}>Upload your PDF</p>
                        <p style={styles.uploadSubtitle}>Click to browse or drag & drop</p>
                        <p style={styles.uploadSubtitle}>Accepts only PDF • Max size: 10MB</p>

                        <input
                            type="file"
                            accept="application/pdf"
                            onChange={(e) => uploadPDF(e.target.files[0])}
                            style={styles.fileInput}
                        />
                    </div>

                    {uploading && (
                        <p style={{ color: "blue", marginTop: 5 }}>Uploading...</p>
                    )}
                </div>

                {/* Chat Messages */}
                <div style={styles.chatArea}>
                    {(messages || []).map((m, idx) => (
                        <div
                            key={idx}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: m.from === "user" ? "flex-end" : "flex-start",
                                gap: 8,
                            }}
                        >
                            <div
                                style={{
                                    ...styles.message,
                                    background: m.from === "user" ? "#d1ecf1" : "#f0f0f0",
                                }}
                            >
                                {m.text}
                            </div>

                            {m.from === "bot" && !isTyping && (
                                <button
                                    style={styles.copyBtnOutside}
                                    onClick={() => navigator.clipboard.writeText(m.text)}
                                    title="Copy answer"
                                >
                                    📋
                                </button>
                            )}
                        </div>
                    ))}

                    {isTyping && (
                        <div style={{ fontStyle: "italic", color: "#666" }}>Generating response...</div>
                    )}

                    <div ref={chatEndRef} />
                    <button
                        style={styles.scrollBtn}
                        onClick={() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" })}
                        title="Scroll to latest message"
                    >
                        &#x2193;
                    </button>
                </div>

                {/* Input Bar */}
                <div style={styles.inputBar}>
                    <input
                        style={styles.input}
                        placeholder="Ask a question..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    />
                    <button style={styles.micBtnRound} onClick={startListening}>🎙️</button>
                    <button style={styles.sendBtn} onClick={() => sendMessage()}>Send</button>
                    <button style={styles.exportBtn} onClick={exportChatToPDF}>Export Chat PDF</button>
                </div>

                <div style={styles.rightColumn}>
                    <Feedback />
                </div>

            </div>
        </div>
    );

}


// ---------- STYLES ----------
const styles = {
    wrapper: {
        width: "100%",
        maxWidth: 700,
        height: "85vh",
        margin: "20px auto",
        border: "1px solid #ddd",
        borderRadius: 10,
        display: "flex",
        flexDirection: "column",
        background: "#fff",
    },

    uploadBox: {
        padding: 15,
        borderBottom: "1px solid #eee",
        background: "#fafafa",
    },

    uploadInner: {
        border: "2px dashed #aaa",
        borderRadius: 10,
        padding: 20,
        textAlign: "center",
        cursor: "pointer",
        position: "relative",
        transition: "0.3s",
    },

    uploadIcon: {
        fontSize: 40,
        marginBottom: 10,
    },

    uploadTitle: {
        fontWeight: "bold",
        fontSize: 16,
        marginBottom: 5,
    },

    uploadSubtitle: {
        fontSize: 12,
        color: "#666",
    },

    fileInput: {
        opacity: 0,
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        cursor: "pointer",
    },

    chatArea: {
        flex: 1,
        overflowY: "auto",
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        position: "relative",
    },

    message: {
        maxWidth: "70%",
        padding: "10px 14px",
        borderRadius: 10,
        fontSize: 15,
        whiteSpace: "pre-line",
    },

    inputBar: {
        display: "flex",
        padding: 10,
        gap: 5,
        borderTop: "1px solid #ddd",
        background: "#fafafa",
    },

    input: {
        flex: 1,
        padding: 12,
        border: "1px solid #ccc",
        borderRadius: 8,
        marginRight: 10,
    },

    sendBtn: {
        padding: "12px 20px",
        background: "#4A90E2",
        color: "#fff",
        border: "none",
        borderRadius: 8,
        cursor: "pointer",
        fontWeight: "bold",
    },
    micBtnRound: {
        width: "44px",
        height: "44px",
        borderRadius: "50%",
        background: "#f1f1f1",
        border: "1px solid #aaa",
        cursor: "pointer",
        fontSize: "22px",
    },
    scrollBtn: {
        position: "absolute",
        bottom: 15,
        right: 15,
        width: 40,
        height: 40,
        backgroundColor: "#2E3B4E", // industrial dark gray
        color: "#fff",
        border: "none",
        borderRadius: "50%",
        cursor: "pointer",
        fontSize: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
        zIndex: 100,
        transition: "background 0.3s",
    },
    copyBtnOutside: {
        width: 28,
        height: 28,
        borderRadius: "50%",
        border: "none",
        cursor: "pointer",
        backgroundColor: "#70757dff", // industrial dark gray
        color: "#fff",
        fontSize: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        transition: "background 0.3s, transform 0.2s",
    },
    exportBtn: {
        padding: "10px 16px",
        backgroundColor: "#28a745",
        color: "#fff",
        border: "none",
        borderRadius: 6,
        cursor: "pointer",
        fontWeight: "bold",
        boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
        transition: "0.3s",
    },



};
