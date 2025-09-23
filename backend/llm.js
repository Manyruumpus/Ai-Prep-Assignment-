/*
 * backend/llm.js
 * (This version is updated to use the /api/chat endpoint)
 */
const axios = require("axios");

// This URL will be loaded from your .env file
const OLLAMA_API_URL = process.env.OLLAMA_API_URL || "http://ollama:11434/api/chat";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "phi3:mini";

/**
 * Extracts and cleans the first valid JSON object from a raw string.
 * @param {string} str - The raw string from the LLM.
 * @returns {string | null} - The cleaned JSON string, or null if not found.
 */
function extractJSON(str) {
  // Try to find JSON, allowing for markdown ```json ... ``` tags
  const jsonMatch = str.match(/```json([\s\S]*?)```|(\{[\s\S]*\})/);
  if (!jsonMatch) return null;
  
  let jsonStr = jsonMatch[1] || jsonMatch[2];
  return jsonStr.replace(/\\n/g, "").replace(/\u00A0/g, ' ').trim();
}

/**
 * Generates a dynamic, meaningful visualization using a two-step LLM process.
 * @param {string} question - The user's question.
 * @returns {Promise<object>} - A promise that resolves to { text, visualization }.
 */
async function generateLLMAnswer(question) {
  try {
    // --- Step 1: Brainstorm a visual concept for the animation ---
    const brainstormingPrompt = `
      You are a creative assistant designing an animation.
      The user's question is: "${question}".

      First, provide a one-sentence explanation of this concept.
      Then, describe a simple but effective animation using basic shapes (circles, rectangles) to visually represent this concept. The animation should show a clear before, during, and after state.

      Example for "Newton's Third Law":
      Explanation: For every action, there is an equal and opposite reaction.
      Animation: A blue circle moves from the left and collides with a red circle. Upon impact, the blue circle recoils to the left, and the red circle is pushed to the right.
    `;

    // --- MODIFIED TO USE /api/chat FORMAT ---
    const brainstormingResponse = await axios.post(OLLAMA_API_URL, {
      model: OLLAMA_MODEL,
      messages: [{ role: "user", content: brainstormingPrompt }], // Use 'messages' array
      stream: false,
    });
    
    // The response is in a different place for /api/chat
    const conceptualDescription = brainstormingResponse.data.message.content;

    // --- Step 2: Convert the concept into a specific JSON format ---
    const generationPrompt = `
      IMPORTANT: Your output MUST be a single, valid JSON object. No other text or markdown.
      Your entire response must start with '{' and end with '}'.

      Translate the following conceptual description into a JSON object.
      Description: "${conceptualDescription}"

      The JSON must contain a "text" field with the explanation and a "visualization" field that brings the animation to life. Use the animation properties (x, y, opacity, fill) to create the described motion.

      JSON Format:
      {
        "text": "<The one-sentence explanation from the description>",
        "visualization": {
          "id": "vis_ollama_dynamic",
          "duration": 4000,
          "fps": 30,
          "layers": [
            {
              "id": "shape1",
              "type": "circle",
              "props": { "x": 100, "y": 200, "r": 30, "fill": "#3498db" },
              "animations": [
                { "property": "x", "from": 100, "to": 250, "start": 0, "end": 2000 }
              ]
            }
          ]
        }
      }
    `;

    // --- MODIFIED TO USE /api/chat FORMAT ---
    const finalResponse = await axios.post(OLLAMA_API_URL, {
      model: OLLAMA_MODEL,
      messages: [{ role: "user", content: generationPrompt }], // Use 'messages' array
      stream: false,
      format: "json", 
    });

    // The response is in a different place for /api/chat
    // and 'format=json' means it's an object, not a string
    let jsonStr = finalResponse.data.message.content;

    if (!jsonStr) {
      throw new Error("No JSON string found in the final LLM output.");
    }

    // We still run extractJSON in case the model *still* wraps it in markdown
    return JSON.parse(extractJSON(jsonStr));

  } catch (e) {
    console.error("Ollama Error creating dynamic visualization:", e.message, e.response ? e.response.data : '');
    // Fallback in case of an error
    return {
      text: "Error generating dynamic visualization. Using fallback.",
      visualization: {
        id: "vis_err",
        duration: 2000,
        fps: 30,
        layers: [
          { id: "error", type: "circle", props: { x: 250, y: 200, r: 50, fill: "#e74c3c" } },
          { type: "text", props: { text: "Error!", x: 250, y: 200, align: "center", baseline: "middle", font: "bold 24px system-ui", fill: "white" } }
        ]
      }
    };
  }
}

module.exports = generateLLMAnswer;