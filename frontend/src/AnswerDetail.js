import React, { useEffect, useState } from "react";

function AnswerDetail({ answerId }) {
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!answerId) return;
    setLoading(true);
    fetch(`http://localhost:5000/api/answers/${answerId}`)
      .then(res => res.json())
      .then(data => {
        setAnswer(data);
        setLoading(false);
      })
      .catch(err => {
        setLoading(false);
        alert("Error fetching answer");
      });
  }, [answerId]);

  if (!answerId) return <div>Select a question above.</div>;
  if (loading) return <div>Loading answer...</div>;
  if (!answer) return <div>No answer found.</div>;

  return (
    <div style={{ border: "1px solid #ccc", padding: 12, marginTop: 12 }}>
      <h3>Answer</h3>
      <div>{answer.text}</div>
      <h4 style={{ marginTop: 12 }}>Visualization Spec (JSON)</h4>
      <pre style={{ background: "#eee", padding: 8, fontSize: 12 }}>
        {JSON.stringify(answer.visualization, null, 2)}
      </pre>
    </div>
  );
}

export default AnswerDetail;
