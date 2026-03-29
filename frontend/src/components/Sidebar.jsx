const topics = [
  "Python",
  "Databases",
  "Algorithms",
  "Networking",
  "Artificial Intelligence",
  "Object-Oriented Programming",
];

export default function Sidebar({ topic, setTopic, sessionId }) {
  return (
    <aside className="sidebar">
      <div>
        <h2>Study Topics</h2>
        <div className="topic-list">
          {topics.map((item) => (
            <button
              key={item}
              className={item === topic ? "topic-btn active" : "topic-btn"}
              onClick={() => setTopic(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="session-box">
        <p className="muted">Current session</p>
        <code>{sessionId || "Creating..."}</code>
      </div>
    </aside>
  );
}