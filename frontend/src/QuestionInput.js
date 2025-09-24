// frontend/src/QuestionInput.js
import React, { useState } from "react";

// REMOVED: The old API_URL variable is no longer needed.

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
      // UPDATED: Use the environment variable to build the full backend URL.
      // Vercel provides this variable to your React app during the build process.
      await fetch(`${process.env.REACT_APP_API_URL}/api/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      setQuestion(""); 
    } catch (err) {
      console.error("Error submitting question:", err); // Log the error for debugging
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