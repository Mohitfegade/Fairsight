const KEYS = [
  process.env.REACT_APP_GEMINI_KEY,
  process.env.REACT_APP_GEMINI_KEY_2,
  process.env.REACT_APP_GEMINI_KEY_3
].filter(Boolean);

const cache = {};

async function callGemini(key, prompt, retryCount = 0) {
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

async function tryAllKeys(prompt, cacheKey) {
  if (cache[cacheKey]) return { text: cache[cacheKey], source: "cache" };
  
  for (let keyIndex = 0; keyIndex < KEYS.length; keyIndex++) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        if (attempt > 0 || keyIndex > 0) {
          await new Promise(r => setTimeout(r, (attempt + 1) * 1500));
        }
        const text = await callGemini(KEYS[keyIndex], prompt);
        cache[cacheKey] = text;
        return { text, source: "gemini" };
      } catch (err) {
        console.warn("Key " + keyIndex + " attempt " + attempt + " failed:", err.message);
        if (err.message !== "RATE_LIMIT") break;
      }
    }
  }
  return { text: null, source: "fallback" };
}

export async function getBiasExplanation(biasResults) {
  const cacheKey = "bias_" + biasResults.fairnessScore + "_" + biasResults.groupResults.length;
  
  const prompt = `You are FairSight, an expert AI bias auditor. Analyze these bias detection results and respond ONLY with valid JSON — no markdown, no backticks, no extra text.

Dataset bias results: ${JSON.stringify({
  fairnessScore: biasResults.fairnessScore,
  groupResults: biasResults.groupResults.slice(0, 8),
  intersectionalFlags: biasResults.intersectionalFlags?.slice(0, 3),
  rawSummary: biasResults.rawSummary
})}

Respond with EXACTLY this JSON:
{
  "summary": "2-3 sentences explaining the main bias finding in plain English for a non-technical HR manager. Be specific about which groups are affected and by how much.",
  "rootCause": "One sentence explaining the most likely root cause of this specific bias.",
  "recommendations": [
    {"title": "Specific fix title", "explanation": "Concrete explanation of what to do", "estimatedImprovement": 15, "difficulty": "Easy"},
    {"title": "Second fix", "explanation": "Concrete explanation", "estimatedImprovement": 10, "difficulty": "Medium"},
    {"title": "Third fix", "explanation": "Concrete explanation", "estimatedImprovement": 8, "difficulty": "Hard"}
  ],
  "regulatoryRisk": "Specific explanation of which EU AI Act 2024 articles and India DPDP Act 2023 sections this violates and why."
}`;

  const { text, source } = await tryAllKeys(prompt, cacheKey);
  
  if (text) {
    try {
      const cleaned = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      parsed._source = source;
      return parsed;
    } catch (err) {
      console.error("JSON parse error:", err);
    }
  }
  
  return getIntelligentFallback(biasResults);
}

export async function getGroupExplanation(group, biasResults) {
  const cacheKey = "group_" + group.group + "_" + group.column + "_" + group.approvalRate;
  
  const prompt = `You are FairSight, an AI bias auditor. A user clicked on a demographic group to understand their bias. Explain this in plain English for a non-technical person.

Group: ${group.group}
Column: ${group.column}  
Approval rate: ${group.approvalRate}%
Disparity from best group: ${group.disparity}%
Risk level: ${group.riskLevel}
Overall dataset fairness score: ${biasResults.fairnessScore}/100

Write 3-4 sentences explaining:
1. What this bias means for real people in this group
2. What likely causes this specific group to be disadvantaged  
3. What real-world harm this causes
4. One concrete thing that could fix it

Be specific to ${group.group}, not generic. Write in plain text, no JSON, no bullet points, no markdown.`;

  const { text, source } = await tryAllKeys(prompt, cacheKey);
  
  if (text) return { explanation: text.trim(), source };
  
  return {
    source: "fallback",
    explanation: getGroupFallback(group, biasResults)
  };
}

function getGroupFallback(group, biasResults) {
  const bestGroup = biasResults.groupResults.reduce(
    (a, b) => a.approvalRate > b.approvalRate ? a : b,
    biasResults.groupResults[0]
  );
  
  if (group.riskLevel === "high") {
    return `People in the ${group.group} group have only a ${group.approvalRate}% approval rate compared to ${bestGroup.approvalRate}% for ${bestGroup.group} — a gap of ${group.disparity}%. In real terms, this means someone from this group is significantly less likely to receive a positive outcome even when their other qualifications are identical to someone from a more favored group. This type of disparity is often caused by historical underrepresentation in training data, where past decisions that discriminated against this group get encoded into the algorithm. To fix this, the training data needs to be rebalanced to ensure ${group.group} is equally represented in positive outcome examples.`;
  } else if (group.riskLevel === "medium") {
    return `The ${group.group} group has a ${group.approvalRate}% approval rate with a ${group.disparity}% disparity from the best-performing group. While this is considered moderate risk, it still means people in this group face a measurably lower chance of a positive outcome. This could be caused by proxy variables in the dataset that correlate with ${group.column}. Monitoring this disparity over time and auditing input features for hidden correlations would help reduce this gap.`;
  }
  return `The ${group.group} group shows a ${group.approvalRate}% approval rate which is within acceptable fairness thresholds. The ${group.disparity}% disparity from the top group is considered low risk. However, continued monitoring is recommended as small disparities can compound over time or worsen with different data distributions.`;
}

function getIntelligentFallback(biasResults) {
  const highRisk = biasResults.groupResults.filter(g => g.riskLevel === "high");
  const worstGroup = biasResults.groupResults.reduce(
    (a, b) => a.disparity > b.disparity ? a : b,
    biasResults.groupResults[0]
  );
  const bestGroup = biasResults.groupResults.reduce(
    (a, b) => a.approvalRate > b.approvalRate ? a : b,
    biasResults.groupResults[0]
  );

  return {
    _source: "fallback",
    summary: highRisk.length > 0
      ? `This dataset shows significant bias against ${highRisk.slice(0,3).map(g => g.group).join(", ")}. The most affected group is ${worstGroup.group} with only ${worstGroup.approvalRate}% approval rate compared to ${bestGroup.approvalRate}% for ${bestGroup.group} — a disparity of ${worstGroup.disparity}%. This pattern suggests systematic discrimination in the decision-making process that requires immediate remediation.`
      : `This dataset shows relatively low bias with an overall fairness score of ${biasResults.fairnessScore}/100. Minor disparities exist but are within acceptable thresholds for most regulatory frameworks.`,
    rootCause: `Historical training data likely overrepresents ${bestGroup.group} in positive outcomes, causing the model to learn biased decision patterns that disadvantage ${worstGroup.group} and similar groups.`,
    recommendations: [
      { title: "Rebalance training data representation", explanation: `Ensure ${worstGroup.group} is equally represented in positive outcome examples. Use oversampling or synthetic data generation to achieve demographic parity in the training set.`, estimatedImprovement: 15, difficulty: "Medium" },
      { title: "Remove or transform proxy variables", explanation: "Audit all input features for correlation with protected attributes. Variables like zip code, school name, or job title often act as proxies for race or gender.", estimatedImprovement: 12, difficulty: "Hard" },
      { title: "Apply post-processing fairness constraints", explanation: "Implement threshold adjustment or reject option classification to equalize approval rates across demographic groups without retraining the model.", estimatedImprovement: 8, difficulty: "Easy" }
    ],
    regulatoryRisk: `A fairness score of ${biasResults.fairnessScore}/100 with ${worstGroup.disparity}% disparity against ${worstGroup.group} likely violates EU AI Act 2024 Article 10 (data governance requirements for high-risk AI systems) and Article 13 (transparency obligations). Under India DPDP Act 2023, Section 4 requires fair and lawful processing — this disparity level could constitute unlawful discrimination in automated decision-making affecting individuals' rights.`
  };
}