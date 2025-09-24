// frontend/src/QuestionInput.js
import React, { useState } from "react";

// --- MODIFIED ---
// We use a relative path.
const API_URL = ""; 

function QuestionInput({ onSubmit, isLoading }) {
  const [question, setQuestion] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;

    const body = {
      userId: "u1",
      question
    };

    onSubmit(question);

    try {
      // Use the relative path here
      await fetch(`${API_URL}/api/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      setQuestion(""); 
    } catch (err) {
      alert("Error submitting question!");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={question}
        onChange={e => setQuestion(e.target.value)}
        placeholder="Ask a question…"
        disabled={isLoading}
      />
      <button
        type="submit"
        disabled={isLoading}
      >
        {isLoading ? "Sending…" : "Send"}
      </button>
    </form>
  );
}

export default QuestionInput;