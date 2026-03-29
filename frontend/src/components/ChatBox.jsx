import { useState } from "react";
import ReactMarkdown from "react-markdown";

export default function ChatBox({
  messages,
  onSend,
  loading,
  topic,
  messagesEndRef,
}) {
  const [input, setInput] = useState("");

  function submit(e) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    onSend(input);
    setInput("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit(e);
    }
  }

  return (
    <section className="card chat-card">
      <div className="card-header">
        <h3>Ask about {topic}</h3>
      </div>

      <div className="messages">
        {messages.length === 0 && (
          <div className="empty-state">
            Try asking: <strong>Explain normalization with an example</strong>
          </div>
        )}

        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            <div className="message-header">
              <span className="avatar">
                {msg.role === "user" ? "U" : "AI"}
              </span>
              <span className="message-role">
                {msg.role === "user" ? "You" : "SmartStudy AI"}
              </span>
            </div>

            <div className="message-content">
              {msg.role === "assistant" ? (
                <ReactMarkdown>{String(msg.message || "")}</ReactMarkdown>
              ) : (
                <p>{String(msg.message || "")}</p>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="message assistant">
            <div className="message-header">
              <span className="avatar">AI</span>
              <span className="message-role">SmartStudy AI</span>
            </div>
            <div className="message-content typing">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef}></div>
      </div>

      <form className="chat-form" onSubmit={submit}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your question here... Press Enter to send, Shift+Enter for new line."
          rows="4"
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send"}
        </button>
      </form>
    </section>
  );
}