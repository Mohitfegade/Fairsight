const KEYS = [
  process.env.REACT_APP_GEMINI_KEY,
  process.env.REACT_APP_GEMINI_KEY_2,
  process.env.REACT_APP_GEMINI_KEY_3,
].filter(Boolean);

const cache = {};
let lastCallTime = 0;
const MIN_INTERVAL = 4000;

async function waitForRateLimit() {
  const now = Date.now();
  const timeSinceLast = now - lastCallTime;
  if (timeSinceLast < MIN_INTERVAL) {
    await new Promise(r => setTimeout(r, MIN_INTERVAL - timeSinceLast));
  }
  lastCallTime = Date.now();
}

async function callGemini(key, prompt) {
  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + key,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 800 }
      })
    }
  );
  const data = await res.json();
  if (data.error?.code === 429) throw new Error("RATE_LIMIT");
  if (data.error) throw new Error(data.error.message);
  if (!data.candidates?.[0]) throw new Error("NO_RESPONSE");
  return data.candidates[0].content.parts[0].text;
}

async function tryWithRetry(prompt, cacheKey) {
  if (cache[cacheKey]) {
    return { text: cache[cacheKey], source: "cache" };
  }

  await waitForRateLimit();

  for (let keyIndex = 0; keyIndex < KEYS.length; keyIndex++) {
    try {
      if (keyIndex > 0) {
        await new Promise(r => setTimeout(r, 3000));
      }
      const text = await callGemini(KEYS[keyIndex], prompt);
      cache[cacheKey] = text;
      return { text, source: "gemini" };
    } catch (err) {
      console.warn("Key " + keyIndex + " failed:", err.message);
      if (err.message === "RATE_LIMIT" && keyIndex < KEYS.length - 1) {
        await new Promise(r => setTimeout(r, 5000));
        continue;
      }
    }
  }
  return { text: null, source: "fallback" };
}

export async function getBiasExplanation(biasResults) {
  const cacheKey = "bias_" + biasResults.fairnessScore + "_" + 
    biasResults.groupResults.slice(0,3).map(g => g.group).join("_");

  const prompt = `You are FairSight, an expert AI bias auditor. Analyze these bias detection results and respond ONLY with valid JSON — no markdown, no backticks, no extra text.

Bias results: ${JSON.stringify({
  fairnessScore: biasResults.fairnessScore,
  groupResults: biasResults.groupResults.slice(0, 6),
  intersectionalFlags: biasResults.intersectionalFlags?.slice(0, 3),
  rawSummary: biasResults.rawSummary
})}

Respond with EXACTLY this JSON:
{
  "summary": "2-3 sentences in plain English explaining the main bias finding. Be specific about which groups are affected and by how much.",
  "rootCause": "One sentence explaining the most likely root cause.",
  "recommendations": [
    {"title": "Fix title", "explanation": "What to do and why", "estimatedImprovement": 15, "difficulty": "Easy"},
    {"title": "Fix title", "explanation": "What to do and why", "estimatedImprovement": 10, "difficulty": "Medium"},
    {"title": "Fix title", "explanation": "What to do and why", "estimatedImprovement": 8, "difficulty": "Hard"}
  ],
  "regulatoryRisk": "Which EU AI Act 2024 articles and India DPDP Act 2023 sections this violates and why."
}`;

  const { text, source } = await tryWithRetry(prompt, cacheKey);

  if (text) {
    try {
      const cleaned = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      parsed._source = source;
      return parsed;
    } catch (err) {
      console.error("Parse error:", err);
    }
  }

  return getIntelligentFallback(biasResults);
}

export async function getGroupExplanation(group, biasResults) {
  const cacheKey = "group_" + group.group + "_" + group.approvalRate;

  const prompt = `You are FairSight, an AI bias auditor. Explain this specific demographic group's bias in plain English for a non-technical person. Write 3-4 sentences. No JSON, no bullet points, plain text only.

Group: ${group.group}
Column: ${group.column}
Approval rate: ${group.approvalRate}%
Disparity: ${group.disparity}%
Risk: ${group.riskLevel}
Dataset fairness score: ${biasResults.fairnessScore}/100

Explain: 1) What this means for real people in this group. 2) Why this group is disadvantaged. 3) What real-world harm this causes. 4) One concrete fix.`;

  const { text, source } = await tryWithRetry(prompt, cacheKey);

  if (text) return { explanation: text.trim(), source };

  return {
    source: "fallback",
    explanation: getGroupFallback(group, biasResults)
  };
}

function getGroupFallback(group, biasResults) {
  const best = biasResults.groupResults.reduce(
    (a, b) => a.approvalRate > b.approvalRate ? a : b,
    biasResults.groupResults[0]
  );
  if (group.riskLevel === "high") {
    return `People in the ${group.group} group have only a ${group.approvalRate}% approval rate compared to ${best.approvalRate}% for ${best.group} — a gap of ${group.disparity}%. In real terms, someone from this group is significantly less likely to receive a positive outcome even when their qualifications are identical. This type of disparity is often caused by historical underrepresentation in training data, where past discriminatory decisions get encoded into the algorithm. To fix this, the training data needs to be rebalanced to ensure ${group.group} is equally represented in positive outcomes.`;
  }
  return `The ${group.group} group shows a ${group.approvalRate}% approval rate with a ${group.disparity}% disparity. This is considered ${group.riskLevel} risk. Continued monitoring and periodic reauditing is recommended to ensure this gap does not widen over time.`;
}

function getIntelligentFallback(biasResults) {
  const highRisk = biasResults.groupResults.filter(g => g.riskLevel === "high");
  const worst = biasResults.groupResults.reduce(
    (a, b) => a.disparity > b.disparity ? a : b, biasResults.groupResults[0]
  );
  const best = biasResults.groupResults.reduce(
    (a, b) => a.approvalRate > b.approvalRate ? a : b, biasResults.groupResults[0]
  );
  return {
    _source: "fallback",
    summary: highRisk.length > 0
      ? `This dataset shows significant bias against ${highRisk.slice(0,3).map(g => g.group).join(", ")}. The most affected group is ${worst.group} with only ${worst.approvalRate}% approval rate compared to ${best.approvalRate}% for ${best.group} — a disparity of ${worst.disparity}%. This pattern suggests systematic discrimination requiring immediate remediation.`
      : `This dataset shows relatively low bias with a fairness score of ${biasResults.fairnessScore}/100. Minor disparities exist but are within acceptable thresholds.`,
    rootCause: `Historical training data likely overrepresents ${best.group} in positive outcomes, causing the model to learn biased patterns that disadvantage ${worst.group}.`,
    recommendations: [
      { title: "Rebalance training data", explanation: `Ensure ${worst.group} is equally represented in positive outcome examples using oversampling or synthetic data generation.`, estimatedImprovement: 15, difficulty: "Medium" },
      { title: "Remove proxy variables", explanation: "Audit all input features for correlation with protected attributes like zip code, school name, or job title.", estimatedImprovement: 12, difficulty: "Hard" },
      { title: "Apply fairness constraints", explanation: "Implement threshold adjustment or reject option classification to equalize approval rates without retraining.", estimatedImprovement: 8, difficulty: "Easy" }
    ],
    regulatoryRisk: `A fairness score of ${biasResults.fairnessScore}/100 with ${worst.disparity}% disparity against ${worst.group} likely violates EU AI Act 2024 Article 10 (data governance) and Article 13 (transparency). Under India DPDP Act 2023, Section 4 requires fair and lawful processing — this disparity level could constitute unlawful discrimination.`
  };
}