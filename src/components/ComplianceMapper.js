import React, { useState } from "react";

const REGULATIONS = [
  {
    id: "eu_ai_act_10",
    name: "EU AI Act 2024",
    article: "Article 10",
    description: "Data governance requirements for high-risk AI systems",
    threshold: 20,
    metric: "demographicParity",
    region: "European Union",
    applies: "Any AI system used for hiring, credit, education, law enforcement"
  },
  {
    id: "eu_ai_act_13",
    name: "EU AI Act 2024",
    article: "Article 13",
    description: "Transparency and provision of information to users",
    threshold: 15,
    metric: "demographicParity",
    region: "European Union",
    applies: "High-risk AI systems must explain decisions to affected persons"
  },
  {
    id: "india_dpdp_4",
    name: "India DPDP Act 2023",
    article: "Section 4",
    description: "Lawful processing of personal data with fairness obligation",
    threshold: 25,
    metric: "demographicParity",
    region: "India",
    applies: "Any automated processing of personal data of Indian citizens"
  },
  {
    id: "india_dpdp_6",
    name: "India DPDP Act 2023",
    article: "Section 6",
    description: "Consent and purpose limitation in data processing",
    threshold: 30,
    metric: "demographicParity",
    region: "India",
    applies: "Processing must not result in discriminatory outcomes"
  },
  {
    id: "eeoc",
    name: "US EEOC Guidelines",
    article: "4/5ths Rule",
    description: "Selection rate for protected group must be 80% of highest group",
    threshold: 80,
    metric: "fourFifthsRule",
    region: "United States",
    applies: "Employment selection, promotion, and termination decisions"
  },
  {
    id: "rbi",
    name: "RBI Fair Practices Code",
    article: "Section 3",
    description: "Non-discriminatory lending practices for Indian banks",
    threshold: 20,
    metric: "demographicParity",
    region: "India",
    applies: "Credit scoring and loan approval systems used by Indian banks"
  }
];

export default function ComplianceMapper({ biasResults, theme }) {
  const [expanded, setExpanded] = useState(null);

  const getStatus = (reg) => {
    if (reg.metric === "fourFifthsRule") {
      return biasResults.metrics?.fourFifthsRule?.passes ? "pass" : "fail";
    }
    const gap = biasResults.metrics?.demographicParity || 0;
    return gap <= reg.threshold ? "pass" : "fail";
  };

  const passCount = REGULATIONS.filter(r => getStatus(r) === "pass").length;
  const failCount = REGULATIONS.filter(r => getStatus(r) === "fail").length;

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: theme.text, margin: 0 }}>
          Regulatory compliance
        </h2>
        <div style={{ display: "flex", gap: 8 }}>
          <span style={{ fontSize: 12, padding: "3px 12px", borderRadius: 20,
            background: "#DCFCE7", color: "#16A34A", fontWeight: 500 }}>
            {passCount} passing
          </span>
          <span style={{ fontSize: 12, padding: "3px 12px", borderRadius: 20,
            background: "#FEE2E2", color: "#DC2626", fontWeight: 500 }}>
            {failCount} failing
          </span>
        </div>
      </div>

      <div style={{ background: theme.card, border: "1px solid " + theme.border,
        borderRadius: 16, overflow: "hidden" }}>
        {REGULATIONS.map((reg, i) => {
          const status = getStatus(reg);
          const isExpanded = expanded === reg.id;
          const statusColor = status === "pass" ? "#16A34A" : "#DC2626";
          const statusBg = status === "pass" ? "#DCFCE7" : "#FEE2E2";

          return (
            <div key={reg.id}>
              <div
                onClick={() => setExpanded(isExpanded ? null : reg.id)}
                style={{
                  padding: "14px 16px", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 12,
                  borderBottom: i < REGULATIONS.length - 1 || isExpanded
                    ? "1px solid " + theme.border : "none",
                  background: isExpanded ? theme.bg : "transparent",
                  transition: "background 0.15s"
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: "50%",
                  background: statusColor, flexShrink: 0 }} />

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 500,
                      color: theme.text }}>
                      {reg.name}
                    </span>
                    <span style={{ fontSize: 11, color: theme.muted,
                      background: theme.bg, padding: "1px 8px",
                      borderRadius: 10, border: "1px solid " + theme.border }}>
                      {reg.article}
                    </span>
                    <span style={{ fontSize: 11, color: theme.muted }}>
                      {reg.region}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>
                    {reg.description}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600,
                    padding: "3px 12px", borderRadius: 20,
                    background: statusBg, color: statusColor }}>
                    {status === "pass" ? "PASS" : "FAIL"}
                  </span>
                  <span style={{ fontSize: 12, color: theme.muted }}>
                    {isExpanded ? "▲" : "▼"}
                  </span>
                </div>
              </div>

              {isExpanded && (
                <div style={{ padding: "12px 16px 16px",
                  borderBottom: i < REGULATIONS.length - 1
                    ? "1px solid " + theme.border : "none",
                  background: theme.bg }}>

                  <div style={{ display: "grid",
                    gridTemplateColumns: "1fr 1fr", gap: 10,
                    marginBottom: 12 }}>
                    <div style={{ background: theme.card,
                      borderRadius: 10, padding: "10px 14px",
                      border: "1px solid " + theme.border }}>
                      <div style={{ fontSize: 11, color: theme.muted,
                        marginBottom: 4 }}>Applies to</div>
                      <div style={{ fontSize: 12, color: theme.text,
                        lineHeight: 1.5 }}>{reg.applies}</div>
                    </div>
                    <div style={{ background: theme.card,
                      borderRadius: 10, padding: "10px 14px",
                      border: "1px solid " + theme.border }}>
                      <div style={{ fontSize: 11, color: theme.muted,
                        marginBottom: 4 }}>Your result</div>
                      <div style={{ fontSize: 12, color: theme.text }}>
                        {reg.metric === "fourFifthsRule"
                          ? "4/5ths rule: " + (biasResults.metrics?.fourFifthsRule?.passes ? "Passes" : "Fails — " + (biasResults.metrics?.fourFifthsRule?.violations?.length || 0) + " group violations")
                          : "Demographic parity gap: " + (biasResults.metrics?.demographicParity || 0) + "% (threshold: " + reg.threshold + "%)"
                        }
                      </div>
                      <div style={{ marginTop: 6 }}>
                        <div style={{ height: 4, background: theme.border,
                          borderRadius: 2, overflow: "hidden" }}>
                          <div style={{
                            height: "100%", borderRadius: 2,
                            background: statusColor,
                            width: reg.metric === "fourFifthsRule"
                              ? (biasResults.metrics?.fourFifthsRule?.passes ? "100%" : "30%")
                              : Math.min(100, ((biasResults.metrics?.demographicParity || 0) / reg.threshold) * 100) + "%"
                          }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{
                    padding: "10px 14px", borderRadius: 10,
                    background: status === "pass" ? "#F0FDF4" : "#FEF2F2",
                    border: "1px solid " + (status === "pass" ? "#BBF7D0" : "#FECACA")
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 600,
                      color: status === "pass" ? "#166534" : "#991B1B",
                      marginBottom: 4 }}>
                      {status === "pass" ? "Compliant" : "Action required"}
                    </div>
                    <div style={{ fontSize: 12,
                      color: status === "pass" ? "#166534" : "#7F1D1D",
                      lineHeight: 1.6 }}>
                      {status === "pass"
                        ? "Your dataset meets acceptable thresholds for this regulation. Continue monitoring and re-audit periodically."
                        : "Your dataset's " + (reg.metric === "fourFifthsRule" 
                            ? "selection rate disparity" 
                            : "demographic parity gap of " + (biasResults.metrics?.demographicParity || 0) + "%") 
                          + " exceeds the acceptable threshold for this regulation. Immediate remediation is recommended before deploying this system."
                      }
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
