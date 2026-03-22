import React, { useState, useEffect } from "react";

export default function DataFlowViz({ theme }) {
  const [activeStep, setActiveStep] = useState(0);
  const [animating, setAnimating] = useState(true);

  useEffect(() => {
    if (!animating) return;
    const interval = setInterval(() => {
      setActiveStep(prev => (prev + 1) % 5);
    }, 1800);
    return () => clearInterval(interval);
  }, [animating]);

  const steps = [
    {
      id: 0,
      label: "Your CSV file",
      icon: "📄",
      description: "You upload a CSV file",
      detail: "Hiring data, loan records, medical data",
      color: "#3B82F6",
      location: "Your device"
    },
    {
      id: 1,
      label: "Browser memory",
      icon: "🧠",
      description: "Papa Parse reads it locally",
      detail: "Pure JavaScript — no network request",
      color: "#8B5CF6",
      location: "Your browser"
    },
    {
      id: 2,
      label: "Bias engine",
      icon: "⚙️",
      description: "FairSight calculates metrics",
      detail: "Math runs in your browser tab",
      color: "#F59E0B",
      location: "Your browser"
    },
    {
      id: 3,
      label: "Gemini API",
      icon: "✨",
      description: "Only statistics sent to Gemini",
      detail: "Numbers only — never your raw data",
      color: "#10B981",
      location: "Google servers"
    },
    {
      id: 4,
      label: "Results + PDF",
      icon: "📊",
      description: "Everything shown locally",
      detail: "PDF generated in your browser",
      color: "#EF4444",
      location: "Your device"
    }
  ];

  const blocked = {
    label: "Your raw data",
    description: "NEVER sent to any server",
    color: "#DC2626"
  };

  return (
    <div style={{ background: theme.card,
      border: "1px solid " + theme.border,
      borderRadius: 16, padding: "1.5rem",
      marginBottom: "1.5rem" }}>

      <div style={{ display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: "1.25rem" }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 600,
            color: theme.text, margin: "0 0 3px" }}>
            Data privacy — how your data flows
          </h2>
          <p style={{ fontSize: 12, color: theme.muted, margin: 0 }}>
            See exactly what happens to your data. Nothing hidden.
          </p>
        </div>
        <button
          onClick={() => setAnimating(!animating)}
          style={{ fontSize: 12, padding: "5px 12px",
            borderRadius: 8, border: "1px solid " + theme.border,
            background: "transparent", cursor: "pointer",
            color: theme.muted }}>
          {animating ? "Pause" : "Play"}
        </button>
      </div>

      <div style={{ position: "relative", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center",
          justifyContent: "space-between", position: "relative" }}>

          {steps.map((step, i) => (
            <React.Fragment key={step.id}>
              <div
                onClick={() => { setActiveStep(i); setAnimating(false); }}
                style={{ display: "flex", flexDirection: "column",
                  alignItems: "center", cursor: "pointer",
                  width: 90, flexShrink: 0 }}>

                <div style={{
                  width: 52, height: 52, borderRadius: "50%",
                  display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 20,
                  border: activeStep === i
                    ? "3px solid " + step.color
                    : "2px solid " + theme.border,
                  background: activeStep === i
                    ? step.color + "20" : theme.bg,
                  transition: "all 0.3s",
                  transform: activeStep === i ? "scale(1.1)" : "scale(1)",
                  boxShadow: activeStep === i
                    ? "0 0 20px " + step.color + "40" : "none"
                }}>
                  {step.icon}
                </div>

                <div style={{ fontSize: 11, fontWeight: 500,
                  color: activeStep === i ? step.color : theme.muted,
                  textAlign: "center", marginTop: 6,
                  lineHeight: 1.3, transition: "color 0.3s" }}>
                  {step.label}
                </div>

                <div style={{ fontSize: 9, color: theme.muted,
                  textAlign: "center", marginTop: 2,
                  padding: "1px 6px", borderRadius: 8,
                  background: theme.bg,
                  border: "1px solid " + theme.border }}>
                  {step.location}
                </div>
              </div>

              {i < steps.length - 1 && (
                <div style={{ flex: 1, height: 2, position: "relative",
                  margin: "0 4px", marginBottom: 32 }}>
                  <div style={{ height: "100%",
                    background: theme.border, borderRadius: 1 }} />
                  <div style={{
                    position: "absolute", top: 0, left: 0,
                    height: "100%", borderRadius: 1,
                    background: steps[i].color,
                    width: activeStep > i ? "100%"
                      : activeStep === i ? "50%" : "0%",
                    transition: "width 0.5s ease"
                  }} />
                  <div style={{
                    position: "absolute", top: -8,
                    left: "50%", transform: "translateX(-50%)",
                    fontSize: 12, color: steps[i].color,
                    opacity: activeStep === i ? 1 : 0,
                    transition: "opacity 0.3s"
                  }}>
                    →
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Active step detail */}
      <div style={{ background: steps[activeStep].color + "10",
        border: "1px solid " + steps[activeStep].color + "30",
        borderRadius: 12, padding: "12px 16px",
        marginBottom: "1rem", transition: "all 0.3s" }}>
        <div style={{ display: "flex", alignItems: "center",
          gap: 10 }}>
          <span style={{ fontSize: 24 }}>{steps[activeStep].icon}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600,
              color: steps[activeStep].color }}>
              Step {activeStep + 1}: {steps[activeStep].description}
            </div>
            <div style={{ fontSize: 12, color: theme.muted,
              marginTop: 2 }}>
              {steps[activeStep].detail}
            </div>
          </div>
          <div style={{ marginLeft: "auto", fontSize: 11,
            padding: "3px 10px", borderRadius: 10,
            background: steps[activeStep].color + "20",
            color: steps[activeStep].color, fontWeight: 500 }}>
            {steps[activeStep].location}
          </div>
        </div>
      </div>

      {/* Blocked data section */}
      <div style={{ background: "#FEF2F2",
        border: "1px solid #FECACA", borderRadius: 12,
        padding: "12px 16px", display: "flex",
        alignItems: "center", gap: 12, marginBottom: "1rem" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%",
          background: "#FEE2E2", display: "flex",
          alignItems: "center", justifyContent: "center",
          fontSize: 18, flexShrink: 0 }}>
          🚫
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600,
            color: "#DC2626" }}>
            Your raw CSV data — NEVER leaves your browser
          </div>
          <div style={{ fontSize: 12, color: "#7F1D1D", marginTop: 2 }}>
            Names, salaries, personal records — processed locally and
            deleted when you close the tab. We only send anonymized
            statistical summaries to Gemini for explanation.
          </div>
        </div>
      </div>

      {/* What gets sent to Gemini */}
      <div style={{ background: "#F0FDF4",
        border: "1px solid #BBF7D0", borderRadius: 12,
        padding: "12px 16px", marginBottom: "1rem" }}>
        <div style={{ fontSize: 12, fontWeight: 600,
          color: "#16A34A", marginBottom: 8 }}>
          What we DO send to Gemini (statistics only):
        </div>
        <div style={{ display: "grid",
          gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {[
            "Fairness score: 77/100",
            "Group approval rates: Race, Sex",
            "Disparity percentages",
            "Risk levels: High/Medium/Low"
          ].map((item, i) => (
            <div key={i} style={{ fontSize: 12, color: "#166534",
              display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "#16A34A" }}>✓</span> {item}
            </div>
          ))}
        </div>
      </div>

      {/* Tech proof */}
      <div style={{ display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {[
          { icon: "🔒", title: "Client-side processing",
            desc: "Papa Parse runs in your browser tab" },
          { icon: "🚫", title: "No server uploads",
            desc: "Zero network requests for your CSV" },
          { icon: "🗑️", title: "Auto-deleted",
            desc: "Data cleared when tab is closed" }
        ].map((item, i) => (
          <div key={i} style={{ background: theme.bg,
            border: "1px solid " + theme.border,
            borderRadius: 10, padding: "10px 12px",
            textAlign: "center" }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>
              {item.icon}
            </div>
            <div style={{ fontSize: 12, fontWeight: 500,
              color: theme.text, marginBottom: 3 }}>
              {item.title}
            </div>
            <div style={{ fontSize: 11, color: theme.muted,
              lineHeight: 1.4 }}>
              {item.desc}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
