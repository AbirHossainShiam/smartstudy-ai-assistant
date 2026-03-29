export default function QuizBox({ topic, onGenerate, quizData }) {
  return (
    <section className="card quiz-card">
      <div className="card-header">
        <h3>Quiz Generator</h3>
        <p>Create a quick quiz for {topic}</p>
      </div>

      <div className="quiz-actions">
        <button onClick={() => onGenerate("Beginner")}>Beginner Quiz</button>
        <button onClick={() => onGenerate("Intermediate")}>Intermediate Quiz</button>
      </div>

      <div className="quiz-content">
        {!quizData && <p className="muted">Generate a quiz to test your understanding.</p>}

        {quizData?.questions?.map((q, index) => (
          <div key={index} className="quiz-question">
            <h4>{index + 1}. {q.question}</h4>
            <ul>
              {q.options.map((option, i) => (
                <li key={i}>{option}</li>
              ))}
            </ul>
            <p><strong>Answer:</strong> {q.answer}</p>
          </div>
        ))}
      </div>
    </section>
  );
}