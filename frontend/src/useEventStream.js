// frontend/src/useEventStream.js
import { useEffect } from "react";

// --- MODIFIED ---
// We use a relative path. Nginx will handle routing this to the backend.
const API_URL = ""; // No host, just relative paths

export default function useEventStream({ onQuestion, onAnswer }) {
  useEffect(() => {
    // Use the relative path here
    const es = new EventSource(`${API_URL}/api/stream`);
    
    es.addEventListener("question_created", e => {
      const data = JSON.parse(e.data);
      if (onQuestion) onQuestion(data.question);
    });
    es.addEventListener("answer_created", e => {
      const data = JSON.parse(e.data);
      if (onAnswer) onAnswer(data.answer);
    });
    
    es.onerror = (err) => {
      console.error("EventSource failed:", err);
      es.close();
    };

    return () => es.close();
  }, [onQuestion, onAnswer]);
}