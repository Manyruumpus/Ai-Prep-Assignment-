// frontend/src/App.js

import React, { useState } from "react";
import QuestionInput from "./QuestionInput";
import VisualizationCanvas from "./VisualizationCanvas";
import useEventStream from "./useEventStream";
import './App.css'; // Import our new styles

function App() {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentAnswer, setCurrentAnswer] = useState(null); // { text, visualization }
  const [isLoading, setIsLoading] = useState(false);
  const [playing, setPlaying] = useState(false);

  // --- Use SSE to get new answers in real-time ---
  useEventStream({
    onQuestion: (question) => {
      // A new question was submitted.
      // We'll set the current question text and show a loading state.
      // Note: We get this from the 'question_created' event.
      setCurrentQuestion(question.question);
      setCurrentAnswer(null); // Clear old answer
      setIsLoading(true);
    },
    onAnswer: (answer) => {
      // The answer has arrived!
      setCurrentAnswer(answer);
      setIsLoading(false);
      
      // Auto-play the visualization
      if (answer.visualization) {
        setPlaying(true); 
        // Auto-pause after its duration
        setTimeout(() => {
          setPlaying(false)
        }, answer.visualization.duration || 4000);
      }
    }
  });

  // This function is passed to QuestionInput
  // It's called when the user hits "Send"
  const handleQuestionSubmit = (questionText) => {
    // We set the loading state and clear old data immediately
    // The `useEventStream`'s `onQuestion` listener will also fire,
    // but this makes the UI feel faster.
    setCurrentQuestion(questionText);
    setCurrentAnswer(null);
    setIsLoading(true);
  };

  return (
    <div className="App">
      {/* Left: Visualization and controls */}
      <div className="visualization-panel">
        <VisualizationCanvas 
          spec={currentAnswer ? currentAnswer.visualization : null} 
          playing={playing} 
        />
        <div className="controls">
          <button 
            onClick={() => setPlaying(true)} 
            disabled={!currentAnswer || !currentAnswer.visualization || playing}
          >
            Play
          </button>
          <button 
            onClick={() => setPlaying(false)} 
            disabled={!currentAnswer || !currentAnswer.visualization || !playing}
          >
            Pause
          </button>
        </div>
      </div>
      
      {/* Right: Chat Panel */}
      <div className="chat-panel">
        <h1>AiPrep Visualizer</h1>
        <QuestionInput onSubmit={handleQuestionSubmit} />
        
        {/* This replaces QuestionsList and AnswerDetail */}
        <div className="answer-display">
          
          {/* Show the Question Card */}
          {currentQuestion && (
            <div className="question-card">
              <strong>Question:</strong> {currentQuestion}
            </div>
          )}
          
          {/* Show Loading or the Answer Card */}
          {isLoading ? (
            <div className="answer-card loading">
              Generating answer and visualization...
            </div>
          ) : currentAnswer ? (
            <div className="answer-card">
              <strong>Answer:</strong> {currentAnswer.text}
            </div>
          ) : !currentQuestion ? (
            <div className="answer-card">
              Ask a question to get started (e.g., "What is Newton's Third Law?")...
            </div>
          ) : null}
          
        </div>
      </div>
    </div>
  );
}

export default App;