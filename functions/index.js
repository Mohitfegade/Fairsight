const functions = require("firebase-functions");
const fetch = require("node-fetch");

exports.callGemini = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).send("Method not allowed");
    return;
  }

  const apiKey = functions.config().gemini.key;
  const { prompt } = req.body;

  if (!prompt) {
    res.status(400).json({ error: "No prompt provided" });
    return;
  }

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 1000 }
        })
      }
    );
    const data = await response.json();
    if (data.error) {
      res.status(500).json({ error: data.error.message });
      return;
    }
    const text = data.candidates[0].content.parts[0].text;
    res.json({ text, source: "gemini" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
