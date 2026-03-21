export async function getBiasExplanation(biasResults) {
  const apiKey = process.env.REACT_APP_GEMINI_KEY;
  if (!apiKey) return getFallback(biasResults);
  
  await new Promise(r => setTimeout(r, 2000));
  
  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `You are FairSight, an AI bias auditor. Analyze these bias results and respond ONLY with valid JSON, no markdown, no backticks. Bias data: ${JSON.stringify(biasResults)}. Respond with exactly: {"summary": "2-3 sentence plain English explanation of the main bias finding", "rootCause": "one sentence root cause", "recommendations": [{"title": "fix title", "explanation": "what to do", "estimatedImprovement": 15, "difficulty": "Easy"}], "regulatoryRisk": "which laws this may violate"}` }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 800 }
        })
      }
    );
    const data = await response.json();
    if (!data.candidates) return getFallback(biasResults);
    const text = data.candidates[0].content.parts[0].text;
    const cleaned = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("Gemini error:", err);
    return getFallback(biasResults);
  }
}

function getFallback(biasResults) {
  return {
    summary: biasResults.rawSummary,
    rootCause: "Historical bias in training data — the model learned from decisions made by humans who had existing biases.",
    recommendations: [
      { title: "Rebalance training data", explanation: "Ensure equal representation across all demographic groups in your training dataset.", estimatedImprovement: 15, difficulty: "Medium" },
      { title: "Remove proxy variables", explanation: "Identify and remove variables that correlate with protected attributes like race or gender.", estimatedImprovement: 10, difficulty: "Hard" },
      { title: "Apply fairness constraints", explanation: "Add mathematical fairness constraints during model training to limit disparate impact.", estimatedImprovement: 8, difficulty: "Hard" }
    ],
    regulatoryRisk: "This level of bias may violate EU AI Act Article 10 (data governance requirements for high-risk AI) and India DPDP Act 2023 Section 4 (fairness in automated processing of personal data)."
  };
}