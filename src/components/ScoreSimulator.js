import React, { useState, useEffect } from "react";

export default function ScoreSimulator({ biasResults, geminiResults, theme }) {
  const baseScore = biasResults.fairnessScore;
  const recs = geminiResults?.recommendations || [];
  const [applied, setApplied] = useState([]);
  const [animating, setAnimating] = useState(false);
  const [displayScore, setDisplayScore] = useState(baseScore);

  const projectedScore = Math.min(100, baseScore + applied.reduce((sum, i) => {
    return sum + (recs[i]?.estimatedImprovement || 0);
  }, 0));

  useEffect(() => {
    if (displayScore === projectedScore) return;
    setAnimating(true);
    const diff = projectedScore - displayScore;
    const steps = Math.abs(diff);
    const direction = diff > 0 ? 1 : -1;
    let current = displayScore;
    const interval = setInterval(() => {
      current += direction;
      setDisplayScore(current);
      if (current === projectedScore) {
        clearInterval(interval);
        setAnimating(false);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [projectedScore]);

  const toggle = (i) => {
    setApplied(prev =>
      prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
    );
  };

  const scoreColor = (s) => s >= 80 ? "#16A34A" : s >= 60 ? "#D97706" : "#DC2626";
  const scoreBg = (s) => s >= 80 ? "#DCFCE7" : s >= 60 ? "#FEF3C7" : "#FEE2E2";
  const scoreLabel = (s) => s >= 80 ? "Compliant" : s >= 60 ? "Moderate risk" : "High risk";
  const improvement = projectedScore - baseScore;

  return (
    <div style={{ background: theme.card, border: "1px solid " + theme.border,
      borderRadius: 16, padding: "1.5rem", marginBottom: "1.5rem" }}>

      <div style={{ marginBottom: "1.25rem" }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: theme.text,
          margin: "0 0 4px" }}>
          Score improvement simulator
        </h2>
        <p style={{ fontSize: 13, color: theme.muted, margin: 0 }}>
          Toggle fixes on and off to see how your fairness score would improve
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: 12, marginBottom: "1.5rem" }}>

        <div style={{ background: theme.bg, borderRadius: 12,
          padding: "1.25rem", border: "1px solid " + theme.border,
          textAlign: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: theme.muted,
            textTransform: "uppercase", letterSpacing: "0.06em",
            marginBottom: 8 }}>
            Current score
          </div>
          <div style={{ fontSize: 40, fontWeight: 700,
            color: scoreColor(baseScore), lineHeight: 1 }}>
            {baseScore}
          </div>
          <div style={{ fontSize: 12, color: theme.muted, marginTop: 4 }}>
            / 100
          </div>
          <div style={{ marginTop: 10, display: "inline-block",
            padding: "3px 12px", borderRadius: 20,
            background: scoreBg(baseScore), fontSize: 11,
            fontWeight: 500, color: scoreColor(baseScore) }}>
            {scoreLabel(baseScore)}
          </div>
        </div>

        <div style={{ background: theme.bg, borderRadius: 12,
          padding: "1.25rem", border: "2px solid " +
            (improvement > 0 ? "#16A34A" : theme.border),
          textAlign: "center", position: "relative" }}>
          {improvement > 0 && (
            <div style={{ position: "absolute", top: -10, left: "50%",
              transform: "translateX(-50%)",
              background: "#16A34A", color: "white",
              fontSize: 11, fontWeight: 600, padding: "2px 10px",
              borderRadius: 10 }}>
              +{improvement} points
            </div>
          )}
          <div style={{ fontSize: 11, fontWeight: 500, color: theme.muted,
            textTransform: "uppercase", letterSpacing: "0.06em",
            marginBottom: 8 }}>
            Projected score
          </div>
          <div style={{ fontSize: 40, fontWeight: 700,
            color: scoreColor(displayScore), lineHeight: 1,
            transition: "color 0.3s" }}>
            {displayScore}
          </div>
          <div style={{ fontSize: 12, color: theme.muted, marginTop: 4 }}>
            / 100
          </div>
          <div style={{ marginTop: 10, display: "inline-block",
            padding: "3px 12px", borderRadius: 20,
            background: scoreBg(displayScore), fontSize: 11,
            fontWeight: 500, color: scoreColor(displayScore) }}>
            {scoreLabel(displayScore)}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <div style={{ height: 8, background: theme.border,
          borderRadius: 4, overflow: "hidden", marginBottom: 6 }}>
          <div style={{
            height: "100%", borderRadius: 4,
            background: scoreColor(displayScore),
            width: displayScore + "%",
            transition: "width 0.03s, background 0.3s"
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between",
          fontSize: 11, color: theme.muted }}>
          <span>0</span>
          <span style={{ color: "#DC2626" }}>60 — High risk</span>
          <span style={{ color: "#D97706" }}>80 — Compliant</span>
          <span>100</span>
        </div>
      </div>

      {applied.length > 0 && projectedScore >= 80 && baseScore < 80 && (
        <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0",
          borderRadius: 10, padding: "10px 14px", marginBottom: "1rem",
          display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>🎉</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#166534" }}>
              Compliance threshold reached!
            </div>
            <div style={{ fontSize: 12, color: "#166534" }}>
              With these fixes applied your dataset would meet regulatory
              fairness thresholds.
            </div>
          </div>
        </div>
      )}

      <div style={{ fontSize: 13, fontWeight: 500, color: theme.text,
        marginBottom: 10 }}>
        Toggle fixes to apply:
      </div>

      {recs.map((r, i) => (
        <div key={i}
          onClick={() => toggle(i)}
          style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "12px 14px", borderRadius: 10, cursor: "pointer",
            marginBottom: 8, transition: "all 0.15s",
            border: applied.includes(i)
              ? "1.5px solid #16A34A"
              : "1px solid " + theme.border,
            background: applied.includes(i) ? "#F0FDF4" : theme.bg
          }}
        >
          <div style={{
            width: 20, height: 20, borderRadius: 6, flexShrink: 0,
            border: applied.includes(i) ? "none" : "2px solid " + theme.border,
            background: applied.includes(i) ? "#16A34A" : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, color: "white", fontWeight: 600,
            transition: "all 0.15s"
          }}>
            {applied.includes(i) ? "✓" : ""}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500,
              color: applied.includes(i) ? "#16A34A" : theme.text }}>
              {r.title}
            </div>
            <div style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>
              {r.explanation?.substring(0, 80)}...
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <span style={{ fontSize: 11, padding: "2px 8px",
              borderRadius: 10, fontWeight: 600,
              background: "#DCFCE7", color: "#16A34A" }}>
              +{r.estimatedImprovement}%
            </span>
            <span style={{ fontSize: 11, padding: "2px 8px",
              borderRadius: 10,
              background: theme.border + "40", color: theme.muted }}>
              {r.difficulty}
            </span>
          </div>
        </div>
      ))}

      {applied.length > 0 && (
        <button onClick={() => setApplied([])}
          style={{ marginTop: 8, width: "100%", padding: "8px",
            borderRadius: 8, border: "1px solid " + theme.border,
            background: "transparent", cursor: "pointer",
            fontSize: 12, color: theme.muted }}>
          Reset all
        </button>
      )}
    </div>
  );
}
