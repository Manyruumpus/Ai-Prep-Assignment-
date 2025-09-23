require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;
const generateLLMAnswer = require("./llm"); 

app.use(cors());
app.use(express.json());

let questions = [];
let answers = {};
let nextQuestionId = 1;
let nextAnswerId = 1;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const errorVisualization = {
  id: "vis_err",
  duration: 2000,
  fps: 30,
  layers: [
    { id: "error", type: "circle", props: { x: 250, y: 200, r: 50, fill: "#e74c3c" } },
    { type: "text", props: { text: "Timeout", x: 250, y: 200, align: "center", baseline: "middle", font: "bold 24px system-ui", fill: "white" } }
  ]
};

const clients = [];
app.get('/api/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const keepAliveId = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 15000);

  clients.push(res);
  req.on('close', () => {
    clearInterval(keepAliveId);
    const i = clients.indexOf(res);
    if (i !== -1) clients.splice(i, 1);
  });
});

// Helper to broadcast event to all clients
function broadcastEvent(eventName, data) {
  const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) {
    client.write(payload);
  }
}

// --- POST /api/questions: Demo answers + LLM fallback ---
app.post('/api/questions', async (req, res) => {
  const { userId, question } = req.body;
  if (!userId || !question) {
    return res.status(400).json({ error: 'userId and question required' });
  }

  const qid = 'q_' + nextQuestionId++;
  const aid = 'a_' + nextAnswerId++;

  questions.push({
    id: qid,
    userId,
    question,
    answerId: aid,
  });

  // Broadcast that a question was created
  broadcastEvent('question_created', {
    question: questions[questions.length - 1]
  });

  const qText = question.toLowerCase();
  let explanation, visualization;
  let isDemo = true; // Flag to track if this is a demo

  if (
    (qText.includes("newton") && qText.includes("first law")) ||
    (qText.includes("motion") && qText.includes("first law")) ||
    (qText.includes("inertia") && qText.includes("law"))
  ) {
    explanation = "Newton’s First Law states that an object will remain at rest or in uniform motion in a straight line unless acted upon by an external force.";
    visualization = {
      id: 'vis_' + aid,
      duration: 4000,
      fps: 30,
      layers: [
        {
          type: "text",
          props: {
            text: "Newton's First Law: Inertia",
            x: 250, y: 30, align: "center", font: "bold 20px system-ui", fill: "#333"
          }
        },
        {
          type: "circle",
          props: { x: 50, y: 200, r: 25, fill: "radial-gradient(#8e44ad, #9b59b6)", stroke: "#6a1b9a", lineWidth: 2 },
          animations: [
            { property: "x", from: 50, to: 450, start: 0, end: 3000 }
          ]
        },
        {
          type: "text",
          props: { text: "No Force = Constant Motion", x: 250, y: 100, align: "center", opacity: 0, font: "18px system-ui" },
          animations: [
            { property: "opacity", from: 0, to: 1, start: 500, end: 1000 },
            { property: "opacity", from: 1, to: 0, start: 2500, end: 3000 }
          ]
        }
      ]
    };

  }
  else if (
    (qText.includes("newton") && qText.includes("second law")) ||
    (qText.includes("motion") && qText.includes("second law")) ||
    (qText.includes("f=ma")) ||
    (qText.includes("force") && qText.includes("mass") && qText.includes("acceleration"))
  ) {
    explanation = "Newton’s Second Law states that the acceleration of an object is directly proportional to the net force acting on it and inversely proportional to its mass (F=ma).";
    visualization = {
      id: 'vis_' + aid,
      duration: 6000,
      fps: 30,
      layers: [
        {
          type: "text",
          props: {
            text: "Newton's Second Law: F=ma",
            x: 250, y: 30, align: "center", font: "bold 20px system-ui", fill: "#333"
          }
        },
        { 
          type: "rect",
          props: { x: 50, y: 150, w: 50, h: 50, fill: "linear-gradient(#2c3e50, #34495e)", borderRadius: 5, stroke: "#bdc3c7", lineWidth: 2 },
          animations: [
            { property: "x", from: 50, to: 200, start: 1000, end: 3000 } // Slower acceleration
          ]
        },
        { 
          type: "text",
          props: { text: "Mass: 2kg", x: 75, y: 125, align: "center", font: "14px system-ui", fill: "#333" }
        },
        { 
          type: "arrow",
          props: { x: 50, y: 175, dx: 0, dy: 0, color: "#e74c3c", lineWidth: 5, opacity: 0 },
          animations: [
            { property: "dx", from: 0, to: 50, start: 1000, end: 1100 },
            { property: "opacity", from: 0, to: 1, start: 900, end: 1100 },
            { property: "opacity", from: 1, to: 0, start: 2900, end: 3000 }
          ]
        },

        { 
          type: "rect",
          props: { x: 50, y: 280, w: 30, h: 30, fill: "linear-gradient(#f39c12, #e67e22)", borderRadius: 3, stroke: "#f1c40f", lineWidth: 2 },
          animations: [
            { property: "x", from: 50, to: 400, start: 1000, end: 3000 } // Faster acceleration
          ]
        },
        { 
          type: "text",
          props: { text: "Mass: 1kg", x: 65, y: 260, align: "center", font: "14px system-ui", fill: "#333" }
        },
        { 
          type: "arrow",
          props: { x: 50, y: 295, dx: 0, dy: 0, color: "#e74c3c", lineWidth: 5, opacity: 0 },
          animations: [
            { property: "dx", from: 0, to: 50, start: 1000, end: 1100 },
            { property: "opacity", from: 0, to: 1, start: 900, end: 1100 },
            { property: "opacity", from: 1, to: 0, start: 2900, end: 3000 }
          ]
        },
        { 
          type: "text",
          props: { text: "Constant Force", x: 250, y: 70, align: "center", font: "16px system-ui", fill: "#e74c3c", opacity: 0 },
          animations: [
            { property: "opacity", from: 0, to: 1, start: 500, end: 1000 },
            { property: "opacity", from: 1, to: 0, start: 3000, end: 3500 }
          ]
        },
        { 
          type: "text",
          props: { text: "F = ma", x: 250, y: 350, align: "center", font: "bold 28px serif", fill: "#2980b9", opacity: 0 },
          animations: [
            { property: "opacity", from: 0, to: 1, start: 3500, end: 4000 }
          ]
        }
      ]
    };
  }
  else if (
    (qText.includes("newton") && qText.includes("third law")) ||
    (qText.includes("motion") && qText.includes("third law")) ||
    (qText.includes("action") && qText.includes("reaction")) ||
    (qText.includes("equal") && qText.includes("opposite"))
  ) {
    explanation = "Newton’s Third Law states that for every action, there is an equal and opposite reaction.";
    visualization = {
      id: 'vis_' + aid,
      duration: 5000,
      fps: 30,
      layers: [
        {
          type: "text",
          props: {
            text: "Newton's Third Law: Action-Reaction",
            x: 250, y: 30, align: "center", font: "bold 20px system-ui", fill: "#333"
          }
        },
        { // Ground
          type: "rect",
          props: { x: 0, y: 300, w: 500, h: 100, fill: "#7f8c8d", borderRadius: 0 }
        },
        { // Ball 1 (Action)
          type: "circle",
          props: { x: 150, y: 200, r: 25, fill: "radial-gradient(#27ae60, #2ecc71)" },
          animations: [
            { property: "y", from: 200, to: 275, start: 0, end: 500 }, // Fall
            { property: "y", from: 275, to: 200, start: 500, end: 1000 }, // Bounce up
            { property: "y", from: 200, to: 275, start: 2000, end: 2500 }, // Fall again
            { property: "y", from: 275, to: 200, start: 2500, end: 3000 } // Bounce up again
          ]
        },
        { // Arrow for Action
          type: "arrow",
          props: { x: 150, y: 220, dx: 0, dy: 50, color: "#e74c3c", opacity: 0 },
          animations: [
            { property: "opacity", from: 0, to: 1, start: 400, end: 500 },
            { property: "opacity", from: 1, to: 0, start: 500, end: 600 },
            { property: "opacity", from: 0, to: 1, start: 2400, end: 2500 },
            { property: "opacity", from: 1, to: 0, start: 2500, end: 2600 }
          ]
        },
        { // Arrow for Reaction
          type: "arrow",
          props: { x: 150, y: 280, dx: 0, dy: -50, color: "#2980b9", opacity: 0 },
          animations: [
            { property: "opacity", from: 0, to: 1, start: 400, end: 500 },
            { property: "opacity", from: 1, to: 0, start: 500, end: 600 },
            { property: "opacity", from: 0, to: 1, start: 2400, end: 2500 },
            { property: "opacity", from: 1, to: 0, start: 2500, end: 2600 }
          ]
        },
        { // Text for action
          type: "text",
          props: { text: "Action", x: 180, y: 240, font: "16px system-ui", fill: "#e74c3c", opacity: 0 },
          animations: [
            { property: "opacity", from: 0, to: 1, start: 400, end: 500 },
            { property: "opacity", from: 1, to: 0, start: 500, end: 600 }
          ]
        },
        { // Text for reaction
          type: "text",
          props: { text: "Reaction", x: 180, y: 260, font: "16px system-ui", fill: "#2980b9", opacity: 0 },
          animations: [
            { property: "opacity", from: 0, to: 1, start: 400, end: 500 },
            { property: "opacity", from: 1, to: 0, start: 500, end: 600 }
          ]
        }
      ]
    };
  }
  else if (qText.includes("photosynthesis")) {
    explanation = "Photosynthesis is the process by which green plants use sunlight to synthesize food from carbon dioxide and water.";
    visualization = {
      id: 'vis_' + aid,
      duration: 5200,
      fps: 30,
      layers: [
        {
          type: "rect",
          props: { x: 0, y: 0, w: 500, h: 400, fill: "linear-gradient(#87CEEB, #c0e0ee)" },
        },
        {
          type: "rect",
          props: { x: 0, y: 300, w: 500, h: 100, fill: "linear-gradient(#228B22, #006400)" },
        },
        {
          type: "text",
          props: {
            text: "Photosynthesis",
            x: 250,
            y: 20,
            align: "center",
            font: "bold 24px system-ui",
            fill: "#005a00",
          },
        },
        {
          type: "circle",
          props: {
            x: 80,
            y: 80,
            r: 40,
            fill: "radial-gradient(yellow, #ffaf00)",
          },
        },
        {
          type: "rect",
          props: {
            x: 200,
            y: 200,
            w: 120,
            h: 60,
            fill: "linear-gradient(green, darkgreen)",
            borderRadius: 30, // Using the new borderRadius!
          },
        },
        {
          type: "circle",
          props: { r: 4, fill: "yellow" },
          animations: [
            { property: "x", from: 90, to: 210, start: 0, end: 1500 },
            { property: "y", from: 100, to: 210, start: 0, end: 1500 },
            { property: "opacity", from: 1, to: 0, start: 1200, end: 1500 },
          ],
        },
        {
          type: "circle",
          props: { r: 4, fill: "yellow" },
          animations: [
            { property: "x", from: 100, to: 220, start: 500, end: 2000 },
            { property: "y", from: 100, to: 220, start: 500, end: 2000 },
            { property: "opacity", from: 1, to: 0, start: 1700, end: 2000 },
          ],
        },
        {
          type: "text",
          props: { text: "CO₂", x: 430, y: 150, font: "18px system-ui" },
        },
        {
          type: "circle",
          props: { r: 6, fill: "#aaa", stroke: "#666" },
          animations: [
            { property: "x", from: 450, to: 260, start: 1000, end: 3000 },
            { property: "y", from: 180, to: 230, start: 1000, end: 3000 },
            { property: "opacity", from: 1, to: 0, start: 2500, end: 3000 },
          ],
        },
        {
          type: "text",
          props: { text: "O₂", x: 430, y: 250, font: "18px system-ui", fill: "#00f" },
        },
        {
          type: "circle",
          props: { r: 6, fill: "lightblue", stroke: "#00aaff" },
          animations: [
            { property: "x", from: 260, to: 450, start: 2000, end: 5000 },
            { property: "y", from: 230, to: 280, start: 2000, end: 5000 },
            { property: "opacity", from: 1, to: 0, start: 4500, end: 5000 },
          ],
        },
      ],
    };
  }
  else if (qText.includes("solar system")) {
    explanation = "The Solar System consists of the Sun at the center with planets orbiting around it due to gravitational pull.";
    visualization = {
      id: 'vis_' + aid,
      duration: 10000, // Long duration for orbits
      fps: 30,
      layers: [
        {
          type: "rect",
          props: { x: 0, y: 0, w: 500, h: 400, fill: "#00001a" },
        },
        { type: "circle", props: { x: 100, y: 50, r: 1, fill: "white", opacity: 0.8 } },
        { type: "circle", props: { x: 200, y: 300, r: 1, fill: "white", opacity: 0.5 } },
        { type: "circle", props: { x: 400, y: 100, r: 2, fill: "white", opacity: 0.7 } },
        { type: "circle", props: { x: 450, y: 350, r: 1, fill: "white", opacity: 0.8 } },
        { type: "circle", props: { x: 50, y: 250, r: 1, fill: "white", opacity: 0.6 } },
        {
          type: "text",
          props: {
            text: "Our Solar System (Inner Planets)",
            x: 250,
            y: 20,
            align: "center",
            font: "bold 22px system-ui",
            fill: "white",
          },
        },
        {
          type: "circle",
          props: {
            x: 250,
            y: 200,
            r: 30,
            fill: "radial-gradient(yellow, #ff8c00)",
          },
        },
        {
          type: "circle",
          props: { r: 3, fill: "#a9a9a9" }, // Mercury
          animations: [
            {
              property: "orbit",
              centerX: 250,
              centerY: 200,
              radius: 50,
              duration: 1800,
            },
          ],
        },
        {
          type: "circle",
          props: { r: 6, fill: "#f5deb3" }, // Venus
          animations: [
            {
              property: "orbit",
              centerX: 250,
              centerY: 200,
              radius: 80,
              duration: 4000,
            },
          ],
        },
        {
          type: "circle",
          props: { r: 7, fill: "radial-gradient(#0077be, #009a00)" }, // Earth
          animations: [
            {
              property: "orbit",
              centerX: 250,
              centerY: 200,
              radius: 110,
              duration: 6000,
            },
          ],
        },
        {
          type: "circle",
          props: { r: 5, fill: "#b22222" }, // Mars
          animations: [
            {
              property: "orbit",
              centerX: 250,
              centerY: 200,
              radius: 150,
              duration: 9000,
            },
          ],
        },
      ],
    };
  }
  else if (
    (qText.includes("dfa") && qText.includes("toc")) ||
    (qText.includes("deterministic finite automaton")) ||
    (qText.includes("what is a dfa"))
  ) {
    explanation = "A Deterministic Finite Automaton (DFA) is a finite state machine that accepts or rejects a given string of symbols by running through a sequence of states, uniquely determined by the input sequence.";
    visualization = {
      id: 'vis_' + aid,
      duration: 7000, // Longer duration for steps
      fps: 30,
      layers: [
        {
          type: "text",
          props: {
            text: "Deterministic Finite Automaton (DFA)",
            x: 250, y: 30, align: "center", font: "bold 20px system-ui", fill: "#333"
          }
        },
        { id: "q0_node", type: "circle", props: { x: 100, y: 200, r: 25, fill: "#3498db", stroke: "#2980b9", lineWidth: 3 } },
        { id: "q1_node", type: "circle", props: { x: 250, y: 200, r: 25, fill: "#e67e22", stroke: "#d35400", lineWidth: 3 } },
        { id: "q2_node", type: "circle", props: { x: 400, y: 200, r: 25, fill: "#27ae60", stroke: "#219f56", lineWidth: 3 } }, // Final state (double circle implicit via styling)

        { type: "text", props: { text: "q0", x: 100, y: 200, align: "center", baseline: "middle", font: "bold 18px monospace", fill: "white" } },
        { type: "text", props: { text: "q1", x: 250, y: 200, align: "center", baseline: "middle", font: "bold 18px monospace", fill: "white" } },
        { type: "text", props: { text: "q2 (Accept)", x: 400, y: 200, align: "center", baseline: "middle", font: "bold 18px monospace", fill: "white" } },

        { // q0 -> q1 on 'a'
          type: "arrow",
          props: { x: 125, y: 200, dx: 100, dy: 0, color: "#9b59b6", lineWidth: 4, opacity: 1 },
          animations: [{ property: "opacity", from: 0, to: 1, start: 500, end: 700 }]
        },
        {
          type: "text", props: { text: "a", x: 175, y: 175, align: "center", font: "16px monospace", fill: "#9b59b6", opacity: 0 },
          animations: [{ property: "opacity", from: 0, to: 1, start: 500, end: 700 }]
        },
        { // q1 -> q2 on 'b'
          type: "arrow",
          props: { x: 275, y: 200, dx: 100, dy: 0, color: "#34495e", lineWidth: 4, opacity: 1 },
          animations: [{ property: "opacity", from: 0, to: 1, start: 1500, end: 1700 }]
        },
        {
          type: "text", props: { text: "b", x: 325, y: 175, align: "center", font: "16px monospace", fill: "#34495e", opacity: 0 },
          animations: [{ property: "opacity", from: 0, to: 1, start: 1500, end: 1700 }]
        },
        { // q1 -> q0 on 'a' (loop back)
          type: "arrow",
          props: { x: 250, y: 175, dx: -100, dy: 0, color: "#f1c40f", lineWidth: 4, opacity: 1 },
          animations: [{ property: "opacity", from: 0, to: 1, start: 2500, end: 2700 }]
        },
        {
          type: "text", props: { text: "a", x: 200, y: 150, align: "center", font: "16px monospace", fill: "#f1c40f", opacity: 0 },
          animations: [{ property: "opacity", from: 0, to: 1, start: 2500, end: 2700 }]
        },
        // Input string animation
        {
          type: "text",
          props: { text: "Input: 'ab'", x: 250, y: 80, align: "center", font: "20px monospace", fill: "#555", opacity: 0 },
          animations: [
            { property: "opacity", from: 0, to: 1, start: 3000, end: 3500 },
            { property: "opacity", from: 1, to: 0, start: 6500, end: 7000 }
          ]
        },
        // Current state indicator
        {
          id: "indicator",
          type: "circle",
          props: { x: 100, y: 200, r: 10, fill: "white", opacity: 0.8, stroke: "red", lineWidth: 2 },
          animations: [
            { property: "x", from: 100, to: 250, start: 4000, end: 4500 }, // q0 -> q1
            { property: "x", from: 250, to: 400, start: 5000, end: 5500 }  // q1 -> q2
          ]
        },
        {
          type: "text",
          props: { text: "Accept!", x: 250, y: 300, align: "center", font: "bold 24px system-ui", fill: "#27ae60", opacity: 0 },
          animations: [
            { property: "opacity", from: 0, to: 1, start: 6000, end: 6500 }
          ]
        }
      ]
    };
  }
  else {
    isDemo = false;
  }

  if (isDemo) {
    console.log(`Demo question identified. Delaying answer for 20 seconds...`);
    
    setTimeout(() => {
      console.log(`Sending demo answer for ${aid}`);
      const mockAnswer = {
        id: aid,
        text: explanation,
        visualization
      };
      answers[aid] = mockAnswer;
      broadcastEvent('answer_created', { answer: mockAnswer });
    }, 20000); // 20,000 milliseconds = 20 seconds

    return res.json({ questionId: qid, answerId: aid });

  } else {
    res.json({ questionId: qid, answerId: aid });

    console.log("Simulating long LLM call (2 minutes)...");
    
    await sleep(120000); 

    console.log("LLM simulation timed out.");
    const timeoutAnswer = {
        id: aid,
        text: "Request timed out. The LLM is not connected.",
        visualization: errorVisualization
    };

    answers[aid] = timeoutAnswer;
    broadcastEvent('answer_created', { answer: timeoutAnswer });
  }
});

app.get('/api/questions', (req, res) => {
  res.json(questions);
});

app.get('/api/answers/:id', (req, res) => {
  const ans = answers[req.params.id];
  if (!ans) return res.status(404).json({ error: 'Answer not found' });
  res.json(ans);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

module.exports = app;