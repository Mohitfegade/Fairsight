import React, { useState, useEffect } from "react";
import UploadScreen from "./components/UploadScreen";
import { analyzeBias } from "./utils/biasEngine";
import CompareDatasets from "./components/CompareDatasets";
import { getBiasExplanation, getGroupExplanation } from "./utils/geminiService";
import { generateComplianceReport } from "./utils/pdfReport";
import ScoreSimulator from "./components/ScoreSimulator";
import ComplianceMapper from "./components/ComplianceMapper";
import FairnessToggle from "./components/FairnessToggle";
import { runFullFairnessAudit } from "./utils/fairnessMetrics";
import LandingPage from "./components/LandingPage";
import Navbar from "./components/Navbar";
import AuditHistory from "./components/AuditHistory";
import { auth, signInWithGoogle, signOutUser, saveAudit } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
ResponsiveContainer, Cell, ReferenceLine, LabelList } from "recharts";

function App() {
  const [currentTheme, setCurrentTheme] = useState("light");
  const [showSettings, setShowSettings] = useState(false);

  const themes = {
    light: {
      name: "Light",
      bg: "#F9FAFB",
      card: "#FFFFFF",
      border: "#E5E7EB",
      text: "#111111",
      muted: "#6B7280",
      navBg: "#FFFFFF",
      accent: "#3B82F6",
    },
    claude: {
      name: "Claude Dark",
      bg: "#1a1a1a",
      card: "#2f2f2f",
      border: "#3d3d3d",
      text: "#ececec",
      muted: "#9b9b9b",
      navBg: "#1a1a1a",
      accent: "#c96442",
    },
    midnight: {
      name: "Midnight",
      bg: "#0F172A",
      card: "#1E293B",
      border: "#334155",
      text: "#F1F5F9",
      muted: "#94A3B8",
      navBg: "#0F172A",
      accent: "#3B82F6",
    },
    soft: {
      name: "Soft White",
      bg: "#FAFAF8",
      card: "#FFFFFF",
      border: "#E8E6E1",
      text: "#1a1a1a",
      muted: "#737373",
      navBg: "#FFFFFF",
      accent: "#7C3AED",
    },
  };

  const theme = themes[currentTheme];

  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return unsub;
  }, []);

  const [screen, setScreen] = useState("upload");
  const [biasResults, setBiasResults] = useState(null);
  const [geminiResults, setGeminiResults] = useState(null);
  const [advancedMetrics, setAdvancedMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [fileName, setFileName] = useState("");

  const [drillGroup, setDrillGroup] = useState(null);
  const [drillLoading, setDrillLoading] = useState(false);
  const [drillExplanation, setDrillExplanation] = useState(null);
  const [showAllGroups, setShowAllGroups] = useState(false);

  const handleGroupDrillDown = async (group) => {
    setDrillGroup(group);
    setDrillLoading(true);
    setDrillExplanation(null);
    const result = await getGroupExplanation(group, biasResults);
    setDrillExplanation(result.explanation);
    setDrillLoading(false);
  };

  const handleAnalyze = async (input) => {
    setLoading(true);
    setFileName(input.fileName);

    setLoadingMsg("Scanning for bias patterns...");
    const results = analyzeBias(input.csvData, input.decisionCol, input.demographicCols);
    setBiasResults(results);

    const advanced = runFullFairnessAudit(
      input.csvData,
      input.decisionCol,
      input.demographicCols,
      null
    );
    setAdvancedMetrics(advanced);

    setLoadingMsg("Asking Gemini AI to explain the findings...");
    const gemini = await getBiasExplanation(results);
    setGeminiResults(gemini);

    setLoading(false);
    setScreen("results");

    if (user) {
      saveAudit(user.uid, input.fileName, results, gemini);
    }
  };

  let screenContent = null;

  if (screen === "history") {
    return (
      <>
        <Navbar user={user} onSignIn={signInWithGoogle} 
          onSignOut={() => { signOutUser(); }}
          onHistory={() => setScreen("history")}
          onCompare={() => setScreen("compare")} theme={theme} />
        <AuditHistory user={user} onBack={() => setScreen("upload")}
          onNewAudit={() => setScreen("upload")} theme={theme} />
      </>
    );
  } else if (screen === "compare") {
    return (
      <>
        <Navbar user={user} onSignIn={signInWithGoogle}
          onSignOut={() => { signOutUser(); setScreen("landing"); }}
          onHistory={() => setScreen("history")}
          onCompare={() => setScreen("compare")} theme={theme} />
        <CompareDatasets
          theme={theme}
          onClose={() => setScreen("upload")}
        />
      </>
    );
  } else if (screen === "landing") {
    screenContent = (
      <div style={{ minHeight: "100vh", background: theme.bg }}>
        <LandingPage onGetStarted={() => setScreen("upload")} theme={theme} />
      </div>
    );
  } else if (loading) {
    screenContent = (
      <div style={{ minHeight: "100vh", background: theme.bg, display: "flex",
        flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <div style={{ width: 48, height: 48, border: "4px solid " + theme.border,
          borderTop: "4px solid " + theme.accent, borderRadius: "50%",
          animation: "spin 1s linear infinite" }} />
        <div style={{ fontSize: 18, fontWeight: 500, color: theme.text }}>{loadingMsg}</div>
        <div style={{ fontSize: 13, color: theme.muted }}>{fileName}</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  } else if (screen === "results" && biasResults) {
    const score = biasResults.fairnessScore;
    const scoreColor = score >= 80 ? "#16A34A" : score >= 60 ? "#D97706" : "#DC2626";
    const scoreLabel = score >= 80 ? "Low risk" : score >= 60 ? "Moderate risk" : "High risk";

    screenContent = (
      <div style={{ minHeight: "100vh", background: theme.bg, 
        paddingTop: 56 }}>
        
        {/* Top header bar - full width */}
        <div style={{ background: theme.card, 
          borderBottom: "1px solid " + theme.border,
          padding: "12px 32px", display: "flex", 
          alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => setScreen("upload")}
              style={{ padding: "6px 14px", borderRadius: 8,
                border: "1px solid " + theme.border,
                background: "transparent", cursor: "pointer",
                fontSize: 13, color: theme.text }}>
              Back
            </button>
            <h1 style={{ fontSize: 20, fontWeight: 600, 
              color: theme.text, margin: 0 }}>
              Fair<span style={{ color: theme.accent }}>Sight</span> Results
            </h1>
            <span style={{ fontSize: 12, color: theme.muted,
              background: theme.bg, padding: "3px 10px",
              borderRadius: 10, border: "1px solid " + theme.border }}>
              {fileName}
            </span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => generateComplianceReport(fileName, biasResults, geminiResults)}
              style={{ padding: "7px 16px", borderRadius: 8, fontSize: 13,
                fontWeight: 500, cursor: "pointer",
                border: "1px solid " + theme.border,
                background: "transparent", color: theme.text }}>
              Download PDF
            </button>
            <button onClick={() => setScreen("compare")}
              style={{ padding: "7px 16px", borderRadius: 8, fontSize: 13,
                fontWeight: 500, cursor: "pointer", border: "none",
                background: theme.accent, color: "white" }}>
              Compare datasets
            </button>
          </div>
        </div>

        {/* KPI row - full width */}
        <div style={{ padding: "16px 32px", 
          borderBottom: "1px solid " + theme.border,
          display: "grid", 
          gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
          {[
            { label: "Fairness score", 
              value: score + "/100", 
              color: scoreColor },
            { label: "Risk level", 
              value: scoreLabel, 
              color: scoreColor },
            { label: "Parity gap", 
              value: (biasResults.metrics?.demographicParity || 0) + "%", 
              color: (biasResults.metrics?.demographicParity || 0) > 20 ? "#DC2626" : "#16A34A" },
            { label: "4/5ths rule", 
              value: biasResults.metrics?.fourFifthsRule?.passes ? "PASS" : "FAIL",
              color: biasResults.metrics?.fourFifthsRule?.passes ? "#16A34A" : "#DC2626" },
            { label: "High risk groups", 
              value: biasResults.groupResults.filter(g => g.riskLevel === "high").length,
              color: biasResults.groupResults.filter(g => g.riskLevel === "high").length > 0 ? "#DC2626" : "#16A34A" },
            { label: "Composite score",
              value: (advancedMetrics?.compositeScore?.composite || score) + "/100",
              color: scoreColor }
          ].map((kpi, i) => (
            <div key={i} style={{ background: theme.card,
              border: "1px solid " + theme.border,
              borderRadius: 12, padding: "12px 16px" }}>
              <div style={{ fontSize: 11, color: theme.muted, 
                marginBottom: 4 }}>{kpi.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, 
                color: kpi.color }}>{kpi.value}</div>
            </div>
          ))}
        </div>

        {/* Main content - 3 column grid */}
        <div style={{ padding: "20px 32px", display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr", gap: 16,
          alignItems: "start" }}>

          {/* LEFT COLUMN */}
          <div>
            {/* Gemini AI Analysis */}
            {geminiResults && (
              <div style={{ background: theme.card,
                border: "1px solid " + theme.border,
                borderRadius: 16, padding: "1.25rem",
                marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600,
                  color: theme.accent, textTransform: "uppercase",
                  letterSpacing: "0.06em", marginBottom: 8,
                  display: "flex", alignItems: "center", gap: 8 }}>
                  Gemini AI Analysis
                  {geminiResults._source === "gemini" ? (
                    <span style={{ fontSize: 10, padding: "2px 8px",
                      borderRadius: 10, background: "#DCFCE7",
                      color: "#16A34A" }}>Live AI</span>
                  ) : (
                    <span style={{ fontSize: 10, padding: "2px 8px",
                      borderRadius: 10, background: "#FEF3C7",
                      color: "#D97706" }}>Estimated</span>
                  )}
                </div>
                <p style={{ fontSize: 13, color: theme.text,
                  lineHeight: 1.7, margin: "0 0 10px" }}>
                  {geminiResults.summary}
                </p>
                {geminiResults.rootCause && (
                  <div style={{ background: theme.bg, borderRadius: 8,
                    padding: "10px 12px", fontSize: 12,
                    color: theme.text, lineHeight: 1.6 }}>
                    <strong>Root cause:</strong> {geminiResults.rootCause}
                  </div>
                )}
              </div>
            )}

            {/* Bar chart */}
            <div style={{ background: theme.card,
              border: "1px solid " + theme.border,
              borderRadius: 16, padding: "1.25rem",
              marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between",
                alignItems: "center", marginBottom: "1rem" }}>
                <h2 style={{ fontSize: 14, fontWeight: 600,
                  color: theme.text, margin: 0 }}>
                  Approval rate by group
                </h2>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={[...biasResults.groupResults]
                  .sort((a,b) => b.disparity - a.disparity)
                  .slice(0, 6)}
                  margin={{ top: 20, right: 10, left: -20, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" 
                    stroke={theme.border} vertical={false}/>
                  <XAxis dataKey="group" tick={{ fontSize: 10, 
                    fill: theme.muted }} interval={0} height={45}
                    angle={-25} textAnchor="end"
                    tickFormatter={v => v.length > 9 ? v.slice(0,9)+".." : v}/>
                  <YAxis tick={{ fontSize: 10, fill: theme.muted }}
                    domain={[0,100]} unit="%" tickLine={false}
                    axisLine={false}/>
                  <Tooltip contentStyle={{ background: theme.card,
                    border: "1px solid " + theme.border,
                    borderRadius: 8, color: theme.text, fontSize: 12 }}
                    formatter={v => v + "%"}/>
                  <ReferenceLine y={Math.round(
                    biasResults.groupResults.reduce((a,b) => 
                      a + b.approvalRate, 0) / 
                    (biasResults.groupResults.length || 1))}
                    stroke="#3B82F6" strokeDasharray="4 4"
                    label={{ value: "avg", fontSize: 10,
                      fill: "#3B82F6", position: "insideTopRight" }}/>
                  <Bar dataKey="approvalRate" radius={[4,4,0,0]}
                    maxBarSize={40}>
                    {[...biasResults.groupResults]
                      .sort((a,b) => b.disparity - a.disparity)
                      .slice(0, 6)
                      .map((g, i) => (
                        <Cell key={i} fill={
                          g.riskLevel === "high" ? "#EF4444" :
                          g.riskLevel === "medium" ? "#F59E0B" : "#22C55E"}/>
                      ))}
                    <LabelList dataKey="approvalRate" position="top"
                      formatter={v => v + "%"}
                      style={{ fontSize: 10, fill: theme.muted }}/>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Fairness definition toggle */}
            <FairnessToggle biasResults={biasResults} theme={theme}
              onDefinitionChange={(def) => console.log(def)} />
          </div>

          {/* MIDDLE COLUMN */}
          <div>
            {/* Group breakdown table */}
            <div style={{ background: theme.card,
              border: "1px solid " + theme.border,
              borderRadius: 16, padding: "1.25rem",
              marginBottom: 16 }}>
              <h2 style={{ fontSize: 14, fontWeight: 600,
                color: theme.text, marginBottom: "1rem" }}>
                Breakdown by group
              </h2>
              <div style={{ display: "grid",
                gridTemplateColumns: "1fr auto auto auto",
                gap: "0", fontSize: 11,
                color: theme.muted, marginBottom: 8,
                padding: "0 8px" }}>
                <span>Group</span>
                <span style={{ textAlign: "right", marginRight: 16 }}>Approval</span>
                <span style={{ textAlign: "right", marginRight: 16 }}>Disparity</span>
                <span>Risk</span>
              </div>
              {(showAllGroups
                ? biasResults.groupResults
                : biasResults.groupResults.slice(0, 8)
              ).map((g, i) => (
                <div key={i} onClick={() => handleGroupDrillDown(g)}
                  style={{ display: "grid",
                    gridTemplateColumns: "1fr auto auto auto",
                    gap: 0, padding: "8px",
                    borderRadius: 8, cursor: "pointer",
                    background: drillGroup?.group === g.group
                      ? theme.accent + "10" : "transparent",
                    border: drillGroup?.group === g.group
                      ? "1px solid " + theme.accent
                      : "1px solid transparent",
                    marginBottom: 4, alignItems: "center",
                    transition: "all 0.15s" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500,
                      color: theme.text }}>{g.group}</div>
                    <div style={{ fontSize: 11,
                      color: theme.muted }}>{g.column}</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600,
                    color: g.riskLevel === "high" ? "#DC2626"
                      : g.riskLevel === "medium" ? "#D97706" : "#16A34A",
                    marginRight: 16, textAlign: "right" }}>
                    {g.approvalRate}%
                  </div>
                  <div style={{ fontSize: 13, color: theme.muted,
                    marginRight: 16, textAlign: "right" }}>
                    {g.disparity}%
                  </div>
                  <span style={{ fontSize: 11, padding: "2px 8px",
                    borderRadius: 10, fontWeight: 500, whiteSpace: "nowrap",
                    background: g.riskLevel === "high" ? "#FEE2E2"
                      : g.riskLevel === "medium" ? "#FEF3C7" : "#DCFCE7",
                    color: g.riskLevel === "high" ? "#DC2626"
                      : g.riskLevel === "medium" ? "#D97706" : "#16A34A" }}>
                    {g.riskLevel === "high" ? "High" 
                      : g.riskLevel === "medium" ? "Med" : "Fair"}
                  </span>
                </div>
              ))}
              {biasResults.groupResults.length > 8 && (
                <button onClick={() => setShowAllGroups(!showAllGroups)}
                  style={{ width: "100%", padding: "8px", borderRadius: 8,
                    border: "1px solid " + theme.border,
                    background: "transparent", cursor: "pointer",
                    fontSize: 12, color: theme.muted, marginTop: 4 }}>
                  {showAllGroups ? "Show less"
                    : "Show all " + biasResults.groupResults.length + " groups"}
                </button>
              )}
            </div>

            {/* Drill down panel */}
            {drillGroup && (
              <div style={{ background: theme.card,
                border: "1px solid " + theme.accent,
                borderRadius: 16, padding: "1.25rem",
                marginBottom: 16,
                borderLeft: "4px solid " + theme.accent }}>
                <div style={{ display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 600,
                    color: theme.accent, textTransform: "uppercase",
                    letterSpacing: "0.06em" }}>
                    Gemini explains — {drillGroup.group}
                  </div>
                  <button onClick={() => {
                      setDrillGroup(null);
                      setDrillExplanation(null);
                    }}
                    style={{ background: "transparent", border: "none",
                      cursor: "pointer", color: theme.muted,
                      fontSize: 16 }}>x</button>
                </div>
                {drillLoading ? (
                  <div style={{ display: "flex", alignItems: "center",
                    gap: 10, color: theme.muted, fontSize: 13 }}>
                    <div style={{ width: 14, height: 14,
                      border: "2px solid " + theme.border,
                      borderTop: "2px solid " + theme.accent,
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite" }} />
                    Analyzing...
                  </div>
                ) : (
                  <p style={{ fontSize: 13, color: theme.text,
                    lineHeight: 1.7, margin: 0 }}>
                    {drillExplanation}
                  </p>
                )}
              </div>
            )}

            {/* Intersectional bias */}
            {biasResults.intersectionalFlags?.length > 0 && (
              <div style={{ background: theme.card,
                border: "1px solid " + theme.border,
                borderRadius: 16, padding: "1.25rem",
                marginBottom: 16 }}>
                <h2 style={{ fontSize: 14, fontWeight: 600,
                  color: "#DC2626", marginBottom: "1rem" }}>
                  Intersectional bias detected
                </h2>
                {biasResults.intersectionalFlags.map((f, i) => (
                  <div key={i} style={{ background: "#FEF2F2",
                    border: "1px solid #FECACA", borderRadius: 10,
                    padding: "10px 12px", marginBottom: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 500,
                      color: "#DC2626" }}>{f.groups}</div>
                    <div style={{ fontSize: 12, color: "#374151",
                      marginTop: 4 }}>
                      {f.approvalRate}% vs baseline {f.baseRate}% — {f.disparity}% disparity
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Score simulator */}
            <ScoreSimulator biasResults={biasResults}
              geminiResults={geminiResults} theme={theme} />
          </div>

          {/* RIGHT COLUMN */}
          <div>
            {/* Advanced metrics */}
            {advancedMetrics && (
              <div style={{ background: theme.card,
                border: "1px solid " + theme.border,
                borderRadius: 16, padding: "1.25rem",
                marginBottom: 16 }}>
                <h2 style={{ fontSize: 14, fontWeight: 600,
                  color: theme.text, marginBottom: "1rem" }}>
                  Advanced metrics
                </h2>
                <div style={{ display: "grid",
                  gridTemplateColumns: "1fr 1fr", gap: 8,
                  marginBottom: 10 }}>
                  {[
                    { label: "Composite score",
                      value: (advancedMetrics.compositeScore?.composite || 0) + "/100",
                      color: scoreColor },
                    { label: "Equal opportunity",
                      value: Object.values(advancedMetrics.byColumn)[0]?.equalOpportunityDiff !== undefined ? Object.values(advancedMetrics.byColumn)[0]?.equalOpportunityDiff + "%" : "N/A",
                      color: "#DC2626" },
                    { label: "FPR parity diff",
                      value: Object.values(advancedMetrics.byColumn)[0]?.fprParityDiff !== undefined ? Object.values(advancedMetrics.byColumn)[0]?.fprParityDiff + "%" : "N/A",
                      color: "#D97706" },
                    { label: "Stat. parity ratio",
                      value: biasResults.metrics?.statisticalParityRatio || "N/A",
                      color: theme.text }
                  ].map((m, i) => (
                    <div key={i} style={{ background: theme.bg,
                      borderRadius: 8, padding: "10px 12px",
                      border: "1px solid " + theme.border }}>
                      <div style={{ fontSize: 10, color: theme.muted,
                        marginBottom: 4 }}>{m.label}</div>
                      <div style={{ fontSize: 16, fontWeight: 700,
                        color: m.color }}>{m.value}</div>
                    </div>
                  ))}
                </div>
                {advancedMetrics.warnings?.length > 0 && (
                  <div style={{ background: "#FEF3C7",
                    border: "1px solid #FDE68A", borderRadius: 8,
                    padding: "8px 10px", fontSize: 11,
                    color: "#92400E" }}>
                    {advancedMetrics.warnings[0]}
                  </div>
                )}
              </div>
            )}

            {/* Regulatory compliance */}
            <ComplianceMapper biasResults={biasResults} theme={theme} />

            {/* Recommended fixes */}
            {geminiResults?.recommendations && (
              <div style={{ background: theme.card,
                border: "1px solid " + theme.border,
                borderRadius: 16, padding: "1.25rem",
                marginBottom: 16 }}>
                <h2 style={{ fontSize: 14, fontWeight: 600,
                  color: theme.text, marginBottom: "1rem" }}>
                  Recommended fixes
                </h2>
                {geminiResults.recommendations.map((r, i) => (
                  <div key={i} style={{ background: theme.bg,
                    border: "1px solid " + theme.border,
                    borderRadius: 10, padding: "10px 12px",
                    marginBottom: 8 }}>
                    <div style={{ display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start", marginBottom: 4 }}>
                      <div style={{ fontSize: 13, fontWeight: 500,
                        color: theme.text }}>
                        {i + 1}. {r.title}
                      </div>
                      <div style={{ display: "flex", gap: 4,
                        flexShrink: 0, marginLeft: 8 }}>
                        <span style={{ fontSize: 10, padding: "2px 6px",
                          borderRadius: 8, background: "#DCFCE7",
                          color: "#16A34A", fontWeight: 600 }}>
                          +{r.estimatedImprovement}%
                        </span>
                        <span style={{ fontSize: 10, padding: "2px 6px",
                          borderRadius: 8, background: theme.border + "40",
                          color: theme.muted }}>
                          {r.difficulty}
                        </span>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: theme.muted,
                      lineHeight: 1.5 }}>{r.explanation}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Regulatory risk */}
            {geminiResults?.regulatoryRisk && (
              <div style={{ background: "#FEF2F2",
                border: "1px solid #FECACA", borderRadius: 16,
                padding: "1.25rem", marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600,
                  color: "#DC2626", textTransform: "uppercase",
                  letterSpacing: "0.06em", marginBottom: 8 }}>
                  Regulatory risk
                </div>
                <p style={{ fontSize: 12, color: "#374151",
                  lineHeight: 1.6, margin: 0 }}>
                  {geminiResults.regulatoryRisk}
                </p>
              </div>
            )}
          </div>

          <div style={{ gridColumn: "1 / -1", 
            display: "flex", gap: 12, marginTop: 8 }}>
            <button
              onClick={() => { setScreen("upload"); setGeminiResults(null); 
                setBiasResults(null); setAdvancedMetrics(null); }}
              style={{ flex: 1, padding: "14px", borderRadius: 10,
                fontSize: 15, fontWeight: 600, border: "none",
                cursor: "pointer", background: "#3B82F6", color: "white" }}>
              Analyze another dataset
            </button>
            <button
              onClick={() => setScreen("compare")}
              style={{ flex: 1, padding: "14px", borderRadius: 10,
                fontSize: 15, fontWeight: 600, cursor: "pointer",
                border: "2px solid #8B5CF6", background: "transparent",
                color: "#8B5CF6" }}>
              Compare two datasets
            </button>
            <button
              onClick={() => generateComplianceReport(
                fileName, biasResults, geminiResults)}
              style={{ flex: 1, padding: "14px", borderRadius: 10,
                fontSize: 15, fontWeight: 600, cursor: "pointer",
                border: "2px solid #3B82F6", background: "transparent",
                color: "#3B82F6" }}>
              Download PDF Report
            </button>
          </div>
        </div>
      </div>
    );
  } else {
    screenContent = (
      <div style={{ minHeight: "100vh", background: theme.bg }}>
        <UploadScreen onAnalyze={handleAnalyze} theme={theme} />
      </div>
    );
  }

  return (
    <>
      <Navbar user={user} onSignIn={signInWithGoogle}
        onSignOut={() => { signOutUser(); setScreen("landing"); }}
        onHistory={() => setScreen("history")}
        onCompare={() => setScreen("compare")} theme={theme} />
      <div style={{ width: "100%", minHeight: "100vh", background: theme.bg }}>
        {screenContent}

        <button
        onClick={() => setShowSettings(!showSettings)}
        title="Appearance settings"
        style={{
          position: "fixed", bottom: 24, left: 24, zIndex: 1000,
          width: 48, height: 48, borderRadius: "50%",
          border: "1px solid " + theme.border,
          background: theme.card, cursor: "pointer",
          display: "flex", alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          color: theme.muted
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
        </svg>
      </button>

      {showSettings && (
        <div style={{
          position: "fixed", bottom: 80, left: 24, zIndex: 1000,
          background: theme.card, border: "1px solid " + theme.border,
          borderRadius: 16, padding: "1.25rem", width: 220,
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)"
        }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: theme.muted,
            textTransform: "uppercase", letterSpacing: "0.08em",
            marginBottom: 12, margin: "0 0 12px" }}>
            Appearance
          </p>
          {Object.entries(themes).map(([key, t]) => (
            <button key={key}
              onClick={() => { setCurrentTheme(key); setShowSettings(false); }}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 10,
                border: currentTheme === key
                  ? "2px solid " + theme.accent
                  : "1px solid " + theme.border,
                background: currentTheme === key
                  ? theme.accent + "15"
                  : "transparent",
                cursor: "pointer", display: "flex",
                alignItems: "center", gap: 10,
                marginBottom: 6, textAlign: "left"
              }}
            >
              <div style={{
                width: 24, height: 24, borderRadius: 6,
                background: t.bg, border: "2px solid " + t.border,
                flexShrink: 0, position: "relative", overflow: "hidden"
              }}>
                <div style={{
                  position: "absolute", bottom: 0, right: 0,
                  width: 12, height: 12, background: t.accent,
                  borderTopLeftRadius: 4
                }} />
              </div>
              <span style={{
                fontSize: 13, fontWeight: currentTheme === key ? 600 : 400,
                color: currentTheme === key ? theme.accent : theme.text
              }}>
                {t.name}
              </span>
              {currentTheme === key && (
                <span style={{ marginLeft: "auto", fontSize: 12,
                  color: theme.accent }}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
      </div>
    </>
  );
}

export default App;