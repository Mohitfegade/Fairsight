
import React, { useState } from "react";
import UploadScreen from "./components/UploadScreen";
import { analyzeBias } from "./utils/biasEngine";
import { getBiasExplanation } from "./utils/geminiService";
import { generateComplianceReport } from "./utils/pdfReport";
import LandingPage from "./components/LandingPage";

function App() {
  const [screen, setScreen] = useState("landing");
  const [biasResults, setBiasResults] = useState(null);
  const [geminiResults, setGeminiResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [fileName, setFileName] = useState("");

  const handleAnalyze = async (input) => {
    setLoading(true);
    setFileName(input.fileName);

    setLoadingMsg("Scanning for bias patterns...");
    const results = analyzeBias(input.csvData, input.decisionCol, input.demographicCols);
    setBiasResults(results);

    setLoadingMsg("Asking Gemini AI to explain the findings...");
    const gemini = await getBiasExplanation(results);
    setGeminiResults(gemini);

    setLoading(false);
    setScreen("results");
  };

  if (screen === "landing") {
    return <LandingPage onGetStarted={() => setScreen("upload")} />;
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#F9FAFB", display: "flex",
        flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <div style={{ width: 48, height: 48, border: "4px solid #E5E7EB",
          borderTop: "4px solid #3B82F6", borderRadius: "50%",
          animation: "spin 1s linear infinite" }} />
        <div style={{ fontSize: 18, fontWeight: 500, color: "#111" }}>{loadingMsg}</div>
        <div style={{ fontSize: 13, color: "#6B7280" }}>{fileName}</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (screen === "results" && biasResults) {
    const score = biasResults.fairnessScore;
    const scoreColor = score >= 80 ? "#16A34A" : score >= 60 ? "#D97706" : "#DC2626";
    const scoreLabel = score >= 80 ? "Low risk" : score >= 60 ? "Moderate risk" : "High risk";

    return (
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "2rem 1rem" }}>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "2rem" }}>
          <button onClick={() => { setScreen("upload"); setGeminiResults(null); }}
            style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #D1D5DB",
              background: "white", cursor: "pointer", fontSize: 13 }}>
            Back
          </button>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: "#111", margin: 0 }}>
            Fair<span style={{ color: "#3B82F6" }}>Sight</span> Results
          </h1>
        </div>

        <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 16,
          padding: "2rem", marginBottom: "1.5rem", textAlign: "center" }}>
          <div style={{ fontSize: 80, fontWeight: 700, color: scoreColor, lineHeight: 1 }}>
            {score}
          </div>
          <div style={{ fontSize: 14, color: "#6B7280", marginTop: 4 }}>Fairness Score out of 100</div>
          <div style={{ marginTop: 12, display: "inline-block", padding: "4px 16px",
            borderRadius: 20, background: scoreColor + "20", color: scoreColor,
            fontSize: 13, fontWeight: 500 }}>
            {scoreLabel}
          </div>
        </div>

        {geminiResults && (
          <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE",
            borderRadius: 16, padding: "1.5rem", marginBottom: "1.5rem" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#3B82F6",
              textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
              Gemini AI Analysis
            </div>
            <p style={{ fontSize: 14, color: "#1E3A5F", lineHeight: 1.7, margin: 0 }}>
              {geminiResults.summary}
            </p>
            {geminiResults.rootCause && (
              <div style={{ marginTop: 12, padding: "10px 14px", background: "white",
                borderRadius: 8, fontSize: 13, color: "#374151" }}>
                <strong>Root cause:</strong> {geminiResults.rootCause}
              </div>
            )}
          </div>
        )}

        <h2 style={{ fontSize: 16, fontWeight: 600, color: "#111", marginBottom: "1rem" }}>
          Breakdown by group
        </h2>

        {biasResults.groupResults.map((g, i) => (
          <div key={i} style={{ background: "white", border: "1px solid #E5E7EB",
            borderRadius: 12, padding: "1rem 1.25rem", marginBottom: 8,
            display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#111" }}>{g.group}</div>
              <div style={{ fontSize: 12, color: "#6B7280" }}>{g.column} - {g.count} records</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: "#111" }}>{g.approvalRate}%</div>
                <div style={{ fontSize: 11, color: "#6B7280" }}>approval rate</div>
              </div>
              <div style={{ padding: "3px 10px", borderRadius: 12, fontSize: 12, fontWeight: 500,
                background: g.riskLevel === "high" ? "#FEE2E2" : g.riskLevel === "medium" ? "#FEF3C7" : "#DCFCE7",
                color: g.riskLevel === "high" ? "#DC2626" : g.riskLevel === "medium" ? "#D97706" : "#16A34A" }}>
                {g.riskLevel === "high" ? "High bias" : g.riskLevel === "medium" ? "Medium" : "Fair"}
              </div>
            </div>
          </div>
        ))}

        {geminiResults && geminiResults.recommendations && (
          <div style={{ marginTop: "1.5rem" }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "#111", marginBottom: "1rem" }}>
              Recommended fixes
            </h2>
            {geminiResults.recommendations.map((r, i) => (
              <div key={i} style={{ background: "white", border: "1px solid #E5E7EB",
                borderRadius: 12, padding: "1rem 1.25rem", marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "#111" }}>
                    {i + 1}. {r.title}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 12 }}>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10,
                      background: "#DCFCE7", color: "#16A34A", fontWeight: 500 }}>
                      +{r.estimatedImprovement}%
                    </span>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10,
                      background: "#F3F4F6", color: "#6B7280" }}>
                      {r.difficulty}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: "#6B7280", marginTop: 6, lineHeight: 1.6 }}>
                  {r.explanation}
                </div>
              </div>
            ))}
          </div>
        )}

        {geminiResults && geminiResults.regulatoryRisk && (
          <div style={{ marginTop: "1.5rem", background: "#FEF2F2",
            border: "1px solid #FECACA", borderRadius: 12, padding: "1rem 1.25rem" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#DC2626",
              textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
              Regulatory risk
            </div>
            <p style={{ fontSize: 13, color: "#374151", margin: 0, lineHeight: 1.6 }}>
              {geminiResults.regulatoryRisk}
            </p>
          </div>
        )}

        {biasResults.intersectionalFlags.length > 0 && (
          <div style={{ marginTop: "1.5rem" }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "#111", marginBottom: "1rem" }}>
              Intersectional bias detected
            </h2>
            {biasResults.intersectionalFlags.map((f, i) => (
              <div key={i} style={{ background: "#FEF2F2", border: "1px solid #FECACA",
                borderRadius: 12, padding: "1rem 1.25rem", marginBottom: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#DC2626" }}>{f.groups}</div>
                <div style={{ fontSize: 13, color: "#374151", marginTop: 4 }}>
                  Approval rate: {f.approvalRate}% vs baseline {f.baseRate}% — {f.disparity}% disparity
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => generateComplianceReport(fileName, biasResults, geminiResults)}
          style={{
            width: "100%", padding: "14px", borderRadius: 10, fontSize: 15,
            fontWeight: 600, border: "2px solid #3B82F6", cursor: "pointer",
            marginTop: "1.5rem", background: "white", color: "#3B82F6"
          }}
        >
          Download Compliance Report PDF
        </button>

        <button onClick={() => { setScreen("upload"); setGeminiResults(null); }}
          style={{ width: "100%", padding: "14px", borderRadius: 10, fontSize: 15,
            fontWeight: 600, border: "none", cursor: "pointer", marginTop: "1.5rem",
            background: "#3B82F6", color: "white" }}>
          Analyze another dataset
        </button>

      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F9FAFB" }}>
      <UploadScreen onAnalyze={handleAnalyze} />
    </div>
  );
}

export default App;