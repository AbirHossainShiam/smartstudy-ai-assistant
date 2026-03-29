import { useEffect, useRef, useState } from "react";
import Sidebar from "./components/Sidebar";
import ChatBox from "./components/ChatBox";
import QuizBox from "./components/QuizBox";

const API_BASE = "http://127.0.0.1:5000/api";
const STORAGE_KEY = "smartstudy_chat_history";
const TOPIC_KEY = "smartstudy_selected_topic";

export default function App() {
  const [sessionId, setSessionId] = useState("");
  const [topic, setTopic] = useState(localStorage.getItem(TOPIC_KEY) || "Python");
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(false);
  const [quizData, setQuizData] = useState(null);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    async function createSession() {
      try {
        const res = await fetch(`${API_BASE}/session`, { method: "POST" });
        const data = await res.json();
        if (data.session_id) {
          setSessionId(data.session_id);
        }
      } catch (error) {
        console.error("Failed to create session:", error);
      }
    }

    createSession();
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem(TOPIC_KEY, topic);
  }, [topic]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(input) {
    if (!input.trim() || !sessionId) return;

    const userMsg = { role: "user", message: input };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
          message: input,
          topic,
        }),
      });

      const data = await res.json();

      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", message: data.reply },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            message: data.error || "Something went wrong.",
          },
        ]);
      }
    } catch (error) {
      console.error("Chat request failed:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", message: "Server error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function generateQuiz(difficulty) {
    setQuizData(null);

    try {
      const res = await fetch(`${API_BASE}/quiz`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic,
          difficulty,
        }),
      });

      const data = await res.json();

      if (data.quiz) {
        try {
          setQuizData(JSON.parse(data.quiz));
        } catch (error) {
          console.error("Quiz JSON parse failed:", error);
          setQuizData({ questions: [] });
        }
      } else {
        setQuizData({ questions: [] });
      }
    } catch (error) {
      console.error("Quiz request failed:", error);
      setQuizData({ questions: [] });
    }
  }

  function clearChat() {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <div className="app-shell">
      <Sidebar topic={topic} setTopic={setTopic} sessionId={sessionId} />

      <main className="main-panel">
        <header className="topbar">
          <div>
            <h1>SmartStudy AI Assistant</h1>
            <p>Ask questions, get simple explanations, and generate quizzes.</p>
          </div>

          <button className="clear-btn" onClick={clearChat}>
            Clear Chat
          </button>
        </header>

        <div className="content-grid">
          <ChatBox
            messages={messages}
            onSend={sendMessage}
            loading={loading}
            topic={topic}
            messagesEndRef={messagesEndRef}
          />

          <QuizBox
            topic={topic}
            onGenerate={generateQuiz}
            quizData={quizData}
          />
        </div>
      </main>
    </div>
  );
}