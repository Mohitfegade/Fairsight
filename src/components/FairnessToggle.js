import React, { useState } from "react";

const DEFINITIONS = [
  {
    id: "demographic_parity",
    name: "Demographic Parity",
    shortName: "Equal outcomes",
    description: "Every demographic group should receive positive outcomes at the same rate. Example: if 60% of men are approved for loans, 60% of women should also be approved.",
    whenToUse: "Best for hiring, lending, and admissions where historical discrimination has disadvantaged certain groups.",
    tradeoff: "May require approving less-qualified candidates from disadvantaged groups to meet quotas.",
    legalBasis: "Required under EU AI Act Article 10 and India DPDP Act Section 4.",
    color: "#3B82F6"
  },
  {
    id: "equal_opportunity",
    name: "Equal Opportunity",
    shortName: "Equal true positives",
    description: "Among qualified candidates, all demographic groups should have equal chances of being correctly identified. Example: among creditworthy applicants, approval rates should be equal across races.",
    whenToUse: "Best for medical diagnosis, fraud detection, and risk assessment where merit-based outcomes matter.",
    tradeoff: "Allows different overall approval rates between groups as long as qualified individuals are treated equally.",
    legalBasis: "Aligns with US EEOC disparate impact guidelines and RBI Fair Practices Code.",
    color: "#8B5CF6"
  }
];

export default function FairnessToggle({ biasResults, theme, onDefinitionChange }) {
  const [selected, setSelected] = useState("demographic_parity");
  const [showInfo, setShowInfo] = useState(false);

  const current = DEFINITIONS.find(d => d.id === selected);

  const handleSelect = (id) => {
    setSelected(id);
    if (onDefinitionChange) onDefinitionChange(id);
  };

  return (
    <div style={{ background: theme.card, border: "1px solid " + theme.border,
      borderRadius: 16, padding: "1.25rem", marginBottom: "1.5rem" }}>

      <div style={{ display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: "1rem" }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: theme.text,
            margin: "0 0 3px" }}>
            Fairness definition
          </h2>
          <p style={{ fontSize: 12, color: theme.muted, margin: 0 }}>
            Different contexts require different definitions of fairness
          </p>
        </div>
        <button
          onClick={() => setShowInfo(!showInfo)}
          style={{ fontSize: 12, color: theme.accent, background: "transparent",
            border: "1px solid " + theme.border, borderRadius: 8,
            padding: "4px 12px", cursor: "pointer" }}>
          {showInfo ? "Hide info" : "Why does this matter?"}
        </button>
      </div>

      {showInfo && (
        <div style={{ background: theme.bg, borderRadius: 10, padding: "12px 14px",
          marginBottom: "1rem", border: "1px solid " + theme.border,
          fontSize: 13, color: theme.text, lineHeight: 1.7 }}>
          Fairness is not one-size-fits-all. A hiring algorithm and a medical
          diagnosis algorithm need different fairness standards. Choosing the
          wrong definition can make discrimination worse, not better. FairSight
          lets you see your data through both lenses so you can make an informed
          decision about which standard applies to your use case.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10,
        marginBottom: "1rem" }}>
        {DEFINITIONS.map(def => (
          <div key={def.id}
            onClick={() => handleSelect(def.id)}
            style={{ padding: "12px 14px", borderRadius: 12, cursor: "pointer",
              border: selected === def.id
                ? "2px solid " + def.color
                : "1px solid " + theme.border,
              background: selected === def.id ? def.color + "10" : theme.bg,
              transition: "all 0.15s" }}>
            <div style={{ display: "flex", alignItems: "center",
              gap: 8, marginBottom: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%",
                border: selected === def.id
                  ? "none" : "2px solid " + theme.border,
                background: selected === def.id ? def.color : "transparent",
                flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 600,
                color: selected === def.id ? def.color : theme.text }}>
                {def.name}
              </span>
            </div>
            <div style={{ fontSize: 12, color: theme.muted, lineHeight: 1.5,
              paddingLeft: 20 }}>
              {def.shortName}
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: current.color + "08",
        border: "1px solid " + current.color + "30",
        borderRadius: 12, padding: "12px 14px" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: current.color,
          marginBottom: 8, textTransform: "uppercase",
          letterSpacing: "0.06em" }}>
          {current.name} — applied to your dataset
        </div>
        <div style={{ fontSize: 13, color: theme.text, lineHeight: 1.7,
          marginBottom: 8 }}>
          {current.description}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr",
          gap: 8 }}>
          <div style={{ background: theme.card, borderRadius: 8,
            padding: "8px 12px" }}>
            <div style={{ fontSize: 11, color: current.color,
              fontWeight: 600, marginBottom: 4 }}>
              When to use
            </div>
            <div style={{ fontSize: 12, color: theme.muted,
              lineHeight: 1.5 }}>
              {current.whenToUse}
            </div>
          </div>
          <div style={{ background: theme.card, borderRadius: 8,
            padding: "8px 12px" }}>
            <div style={{ fontSize: 11, color: "#D97706",
              fontWeight: 600, marginBottom: 4 }}>
              Tradeoff
            </div>
            <div style={{ fontSize: 12, color: theme.muted,
              lineHeight: 1.5 }}>
              {current.tradeoff}
            </div>
          </div>
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: theme.muted,
          fontStyle: "italic" }}>
          Legal basis: {current.legalBasis}
        </div>
      </div>
    </div>
  );
}
