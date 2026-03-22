import React, { useState, useEffect } from "react";
import UploadScreen from "./components/UploadScreen";
import { analyzeBias } from "./utils/biasEngine";
import CompareDatasets from "./components/CompareDatasets";
import { getBiasExplanation, getGroupExplanation } from "./utils/geminiService";
import { generateComplianceReport } from "./utils/pdfReport";
import ScoreSimulator from "./components/ScoreSimulator";
import ComplianceMapper from "./components/ComplianceMapper";
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
        width: "100%", paddingTop: 56 }}>
        <div style={{ 
          maxWidth: 900, 
          margin: "0 auto", 
          padding: "2rem 1.5rem" 
        }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "2rem" }}>
          <button onClick={() => { setScreen("upload"); setGeminiResults(null); }}
            style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid " + theme.border,
              background: theme.card, color: theme.text, cursor: "pointer", fontSize: 13 }}>
            Back
          </button>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: theme.text, margin: 0 }}>
            Fair<span style={{ color: theme.accent }}>Sight</span> Results
          </h1>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: "1.5rem", flexWrap: "wrap" }}>
          {["Score", "Chart", "Fixes", "PDF"].map((section) => (
            <a key={section} href={"#section-" + section.toLowerCase()}
              style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12,
                fontWeight: 500, border: "1px solid " + theme.border,
                color: theme.muted, textDecoration: "none",
                background: theme.card }}>
              {section}
            </a>
          ))}
        </div>

          <div style={{ display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
            gap: 16, marginBottom: "1.5rem" }}>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div id="section-score" style={{ background: theme.card, border: "1px solid " + theme.border, borderRadius: 16,
                padding: "2rem", textAlign: "center" }}>
                <div style={{ fontSize: 80, fontWeight: 700, color: scoreColor, lineHeight: 1 }}>
                  {score}
                </div>
                <div style={{ fontSize: 14, color: theme.muted, marginTop: 4 }}>Fairness Score out of 100</div>
                <div style={{ marginTop: 12, display: "inline-block", padding: "4px 16px",
                  borderRadius: 20, background: scoreColor + "20", color: scoreColor,
                  fontSize: 13, fontWeight: 500 }}>
                  {scoreLabel}
                </div>
              </div>

              {biasResults.metrics && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
                  {[
                    {
                      label: "Fairness score",
                      value: biasResults.fairnessScore + "/100",
                      sub: "Overall rating",
                      color: biasResults.fairnessScore >= 80 ? "#16A34A" :
                             biasResults.fairnessScore >= 60 ? "#D97706" : "#DC2626"
                    },
                    {
                      label: "Demographic parity gap",
                      value: biasResults.metrics.demographicParity + "%",
                      sub: "Max approval rate diff",
                      color: biasResults.metrics.demographicParity > 20 ? "#DC2626" :
                             biasResults.metrics.demographicParity > 10 ? "#D97706" : "#16A34A"
                    },
                    {
                      label: "Statistical parity ratio",
                      value: biasResults.metrics.statisticalParityRatio,
                      sub: "Min/max ratio",
                      color: biasResults.metrics.statisticalParityRatio < 0.8 ? "#DC2626" :
                             biasResults.metrics.statisticalParityRatio < 0.9 ? "#D97706" : "#16A34A"
                    },
                    {
                      label: "4/5ths rule",
                      value: biasResults.metrics.fourFifthsRule.passes ? "PASS" : "FAIL",
                      sub: biasResults.metrics.fourFifthsRule.passes
                        ? "No violations"
                        : biasResults.metrics.fourFifthsRule.violations.length + " violating",
                      color: biasResults.metrics.fourFifthsRule.passes ? "#16A34A" : "#DC2626"
                    }
                  ].map((m, i) => (
                    <div key={i} style={{ background: theme.card,
                      border: "1px solid " + theme.border,
                      borderRadius: 12, padding: "1rem" }}>
                      <div style={{ fontSize: 11, color: theme.muted, marginBottom: 4 }}>
                        {m.label}
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: m.color }}>
                        {m.value}
                      </div>
                      <div style={{ fontSize: 11, color: theme.muted, marginTop: 2 }}>
                        {m.sub}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div id="section-chart" style={{ background: theme.card, border: "1px solid " + theme.border,
              borderRadius: 16, padding: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", 
                alignItems: "center", marginBottom: "1rem" }}>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: theme.text, margin: 0 }}>
                  Approval rate by group
                </h2>
                <span style={{ fontSize: 12, color: theme.muted }}>
                  Higher = more approvals received
                </span>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart 
                  data={[...biasResults.groupResults]
                    .sort((a,b) => b.disparity - a.disparity)
                    .slice(0, 8)}
                  margin={{ top: 25, right: 20, left: -10, bottom: 20 }}
                  barCategoryGap="25%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.border} vertical={false} />
                  <XAxis
                    dataKey="group"
                    tick={{ fontSize: 10, fill: theme.muted }}
                    tickLine={false}
                    interval={0}
                    height={45}
                    angle={-25}
                    textAnchor="end"
                    tickFormatter={(v) => v.length > 9 ? v.slice(0,9)+".." : v}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: theme.muted }}
                    domain={[0, 100]}
                    unit="%"
                    tickLine={false}
                    axisLine={false}
                    tickCount={6}
                  />
                  <Tooltip
                    cursor={{ fill: theme.border, opacity: 0.3 }}
                    contentStyle={{
                      background: theme.card,
                      border: "1px solid " + theme.border,
                      borderRadius: 10,
                      color: theme.text,
                      fontSize: 13,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                    }}
                    formatter={(value, name, props) => [
                      value + "% approval rate",
                      props.payload.column
                    ]}
                  />
                  <ReferenceLine
                    y={Math.round(biasResults.groupResults.reduce((a,b) => a + b.approvalRate, 0) / (biasResults.groupResults.length || 1))}
                    stroke="#3B82F6"
                    strokeDasharray="5 5"
                    strokeWidth={1.5}
                    label={{
                      value: "avg",
                      position: "insideTopRight",
                      fontSize: 11,
                      fill: "#3B82F6"
                    }}
                  />
                  <Bar dataKey="approvalRate" radius={[6, 6, 0, 0]} maxBarSize={60}>
                    {biasResults.groupResults.map((g, i) => (
                      <Cell key={i} fill={
                        g.riskLevel === "high" ? "#EF4444" :
                        g.riskLevel === "medium" ? "#F59E0B" : "#22C55E"
                      } />
                    ))}
                    <LabelList
                      dataKey="approvalRate"
                      position="top"
                      formatter={(v) => v + "%"}
                      style={{ fontSize: 11, fontWeight: 600, fill: theme.muted }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", gap: 20, justifyContent: "center",
                marginTop: 4, fontSize: 12, color: theme.muted }}>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 10, height: 10, background: "#EF4444",
                    borderRadius: 3, display: "inline-block" }} />High bias
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 10, height: 10, background: "#F59E0B",
                    borderRadius: 3, display: "inline-block" }} />Medium
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 10, height: 10, background: "#22C55E",
                    borderRadius: 3, display: "inline-block" }} />Fair
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 12, height: 2, background: "#3B82F6",
                    borderStyle: "dashed", display: "inline-block" }} />Average
                </span>
              </div>
            </div>

          </div>

          <div style={{ background: theme.card, border: "1px solid " + theme.border,
            borderRadius: 16, padding: "1.25rem", marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: theme.text, 
              marginBottom: "1rem" }}>Breakdown by group</h2>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid " + theme.border }}>
                    <th style={{ textAlign: "left", padding: "6px 8px", 
                      color: theme.muted, fontWeight: 500 }}>Group</th>
                    <th style={{ textAlign: "left", padding: "6px 8px", 
                      color: theme.muted, fontWeight: 500 }}>Column</th>
                    <th style={{ textAlign: "right", padding: "6px 8px", 
                      color: theme.muted, fontWeight: 500 }}>Approval</th>
                    <th style={{ textAlign: "right", padding: "6px 8px", 
                      color: theme.muted, fontWeight: 500 }}>Disparity</th>
                    <th style={{ textAlign: "center", padding: "6px 8px", 
                      color: theme.muted, fontWeight: 500 }}>Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {(showAllGroups 
                    ? biasResults.groupResults 
                    : biasResults.groupResults.slice(0, 8)
                  ).map((g, i) => (
                    <tr key={i} 
                      onClick={() => handleGroupDrillDown(g)}
                      style={{ 
                        borderBottom: "0.5px solid " + theme.border,
                        background: drillGroup?.group === g.group && drillGroup?.column === g.column
                          ? theme.accent + "15"
                          : i % 2 === 0 ? "transparent" : theme.bg + "50",
                        cursor: "pointer"
                      }}>
                      <td style={{ padding: "8px 8px", color: theme.text, 
                        fontWeight: 500 }}>{g.group}</td>
                      <td style={{ padding: "8px 8px", color: theme.muted, 
                        fontSize: 12 }}>{g.column}</td>
                      <td style={{ padding: "8px 8px", color: theme.text, 
                        textAlign: "right", fontWeight: 600 }}>{g.approvalRate}%</td>
                      <td style={{ padding: "8px 8px", textAlign: "right",
                        color: g.riskLevel === "high" ? "#DC2626" : 
                               g.riskLevel === "medium" ? "#D97706" : "#16A34A",
                        fontWeight: 500 }}>{g.disparity}%</td>
                      <td style={{ padding: "8px 8px", textAlign: "center" }}>
                        <span style={{ 
                          padding: "2px 8px", borderRadius: 10, fontSize: 11,
                          fontWeight: 500,
                          background: g.riskLevel === "high" ? "#FEE2E2" : 
                                      g.riskLevel === "medium" ? "#FEF3C7" : "#DCFCE7",
                          color: g.riskLevel === "high" ? "#DC2626" : 
                                 g.riskLevel === "medium" ? "#D97706" : "#16A34A"
                        }}>
                          {g.riskLevel === "high" ? "High" : 
                           g.riskLevel === "medium" ? "Med" : "Fair"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {biasResults.groupResults.length > 8 && (
                <button
                  onClick={() => setShowAllGroups(!showAllGroups)}
                  style={{
                    width: "100%", padding: "10px", borderRadius: 10,
                    border: "1px solid " + theme.border,
                    background: "transparent", cursor: "pointer",
                    fontSize: 13, color: theme.muted, marginTop: 12, marginBottom: 8
                  }}
                >
                  {showAllGroups 
                    ? "Show less" 
                    : "Show all " + biasResults.groupResults.length + " groups"}
                </button>
              )}
            </div>
          </div>

          {drillGroup && (
            <div style={{
              background: theme.card,
              border: "1px solid " + theme.accent,
              borderRadius: 16, padding: "1.5rem",
              marginBottom: "1.5rem",
              borderLeft: "4px solid " + theme.accent
            }}>
              <div style={{ display: "flex", justifyContent: "space-between",
                alignItems: "center", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: theme.accent,
                    textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                    Gemini explains — {drillGroup.group}
                  </div>
                  <div style={{ fontSize: 13, color: theme.muted }}>
                    {drillGroup.approvalRate}% approval rate — {drillGroup.disparity}% disparity
                  </div>
                </div>
                <button onClick={() => { setDrillGroup(null); setDrillExplanation(null); }}
                  style={{ background: "transparent", border: "none", 
                    cursor: "pointer", color: theme.muted, fontSize: 18 }}>
                  x
                </button>
              </div>
              
              {drillLoading ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10,
                  color: theme.muted, fontSize: 14 }}>
                  <div style={{ width: 16, height: 16, border: "2px solid " + theme.border,
                    borderTop: "2px solid " + theme.accent, borderRadius: "50%",
                    animation: "spin 1s linear infinite" }} />
                  Gemini is analyzing this group...
                </div>
              ) : (
                <p style={{ fontSize: 14, color: theme.text, lineHeight: 1.8,
                  margin: 0 }}>
                  {drillExplanation}
                </p>
              )}
            </div>
          )}

          {geminiResults && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: "1.5rem" }}>
              <div style={{ background: theme.card, border: "1px solid " + theme.border,
                borderRadius: 16, padding: "1.25rem" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: theme.accent,
                  textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                  Gemini AI Analysis
                  {geminiResults._source === "gemini" ? (
                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10,
                      background: "#DCFCE7", color: "#16A34A", fontWeight: 500,
                      marginLeft: 8 }}>
                      Live AI
                    </span>
                  ) : (
                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10,
                      background: "#FEF3C7", color: "#D97706", fontWeight: 500,
                      marginLeft: 8 }}>
                      Estimated
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 14, color: theme.text, lineHeight: 1.7, margin: 0 }}>
                  {geminiResults.summary}
                </p>
                {geminiResults.rootCause && (
                  <div style={{ marginTop: 12, padding: "10px 14px", background: theme.bg,
                    borderRadius: 8, fontSize: 13, color: theme.text, border: "1px solid " + theme.border }}>
                    <strong>Root cause:</strong> {geminiResults.rootCause}
                  </div>
                )}
              </div>
              
              {geminiResults.recommendations && (
                <div>
                  <ScoreSimulator
                    biasResults={biasResults}
                    geminiResults={geminiResults}
                    theme={theme}
                  />
                  <div id="section-fixes" style={{ background: theme.card, border: "1px solid " + theme.border, 
                    borderRadius: 16, padding: "1.25rem" }}>
                    <h2 style={{ fontSize: 16, fontWeight: 600, color: theme.text, marginBottom: "1rem" }}>
                      Recommended fixes
                    </h2>
                  {geminiResults.recommendations.map((r, i) => (
                    <div key={i} style={{ background: theme.bg, border: "1px solid " + theme.border,
                      borderRadius: 12, padding: "12px", marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: theme.text }}>
                          {i + 1}. {r.title}
                        </div>
                        <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 12 }}>
                          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10,
                            background: "#DCFCE7", color: "#16A34A", fontWeight: 500 }}>
                            +{r.estimatedImprovement}%
                          </span>
                          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10,
                            background: theme.card, color: theme.muted, border: "1px solid " + theme.border }}>
                            {r.difficulty}
                          </span>
                        </div>
                      </div>
                      <div style={{ fontSize: 13, color: theme.muted, marginTop: 6, lineHeight: 1.5 }}>
                        {r.explanation}
                      </div>
                    </div>
                  ))}
                </div>
                </div>
              )}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: "1.5rem" }}>
            {biasResults.metrics && (
              <ComplianceMapper 
                biasResults={biasResults} 
                theme={theme} 
              />
            )}
            
            {biasResults.intersectionalFlags.length > 0 ? (
              <div style={{ background: theme.card, border: "1px solid " + theme.border, 
                borderRadius: 16, padding: "1.25rem" }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: theme.text, marginBottom: "1rem" }}>
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
            ) : <div />}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: "1.5rem" }}>
            <button
              id="section-pdf"
              onClick={() => generateComplianceReport(fileName, biasResults, geminiResults)}
              style={{
                width: "100%", padding: "14px", borderRadius: 10, fontSize: 15,
                fontWeight: 600, border: "2px solid " + theme.accent, cursor: "pointer",
                background: theme.card, color: theme.accent
              }}
            >
              Download Compliance Report PDF
            </button>

            <button onClick={() => { setScreen("upload"); setGeminiResults(null); }}
              style={{ width: "100%", padding: "14px", borderRadius: 10, fontSize: 15,
                fontWeight: 600, border: "none", cursor: "pointer",
                background: theme.accent, color: "#FFFFFF" }}>
              Analyze another dataset
            </button>
            <button
              onClick={() => setScreen("compare")}
              style={{ width: "100%", padding: "14px", borderRadius: 10,
                fontSize: 15, fontWeight: 600, marginTop: 10,
                border: "2px solid #8B5CF6", cursor: "pointer",
                background: "transparent", color: "#8B5CF6" }}>
              Compare two datasets
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