import React, { useState } from "react";

const CULTURAL_BIAS_PATTERNS = [
  {
    id: "name_bias",
    trigger: ["name", "first_name", "last_name", "surname", "full_name"],
    title: "Name-based discrimination detected",
    severity: "critical",
    description: "Your dataset contains name columns. AI systems are documented to discriminate based on names that signal ethnicity or religion.",
    realExample: "Google's own research showed resume screening AI rated identical resumes differently based on whether the name sounded 'White' or 'Black'.",
    affectedGroups: ["Muslim names (Mohammed, Fatima)", "Indian names (Priya, Rahul)", "African-American names (DeShawn, Lakisha)", "Hispanic names (Miguel, Carmen)"],
    recommendation: "Remove or anonymize name columns before training. Use blind screening."
  },
  {
    id: "location_bias",
    trigger: ["pincode", "pin_code", "postal_code", "zip", "zip_code", "area", "locality", "district", "village", "tehsil"],
    title: "Geographic proxy discrimination",
    severity: "high",
    description: "Location columns like pincode or district often act as proxies for caste, religion, or economic class in India.",
    realExample: "Indian credit scoring systems have been found to reject applications from certain pincodes that correlate with lower-caste communities.",
    affectedGroups: ["Rural applicants", "Specific district/tehsil residents", "Economically marginalized areas"],
    recommendation: "Test if removing location columns improves fairness. Consider using broader region groupings."
  },
  {
    id: "language_bias",
    trigger: ["language", "mother_tongue", "lang", "dialect", "medium"],
    title: "Language and dialect discrimination",
    severity: "high",
    description: "Language columns can discriminate against non-English speakers or regional language speakers in India.",
    realExample: "Google Translate was documented to produce gender-stereotyped translations for certain languages, showing systemic language bias in AI.",
    affectedGroups: ["Hindi/Urdu speakers in English-dominant contexts", "Regional language speakers", "Non-native English speakers"],
    recommendation: "Ensure equal representation of all language groups in training data."
  },
  {
    id: "caste_proxy",
    trigger: ["surname", "gotra", "community", "caste", "subcaste", "jati", "varna"],
    title: "Caste-based discrimination risk",
    severity: "critical",
    description: "Surname and community columns are strong proxies for caste in India. AI systems trained on historical data may perpetuate caste discrimination.",
    realExample: "Studies in India show that job applications with surnames associated with lower castes receive significantly fewer callbacks, even with identical qualifications.",
    affectedGroups: ["Scheduled Caste applicants", "Scheduled Tribe applicants", "OBC communities"],
    recommendation: "Remove caste-related columns. This may also violate Article 15 of the Indian Constitution."
  },
  {
    id: "religion_proxy",
    trigger: ["religion", "faith", "church", "mosque", "temple", "friday", "prayer", "halal", "kosher"],
    title: "Religious discrimination risk",
    severity: "critical",
    description: "Religious indicators in data can cause systematic discrimination against minority religious communities.",
    realExample: "Amazon's hiring AI was found to penalize resumes mentioning women's colleges — similar proxy discrimination happens with religious markers.",
    affectedGroups: ["Muslim applicants", "Christian minorities", "Sikh applicants", "Religious minority communities"],
    recommendation: "Remove all direct or indirect religious identifiers from decision-making data."
  },
  {
    id: "age_proxy",
    trigger: ["dob", "date_of_birth", "birth_date", "birth_year", "year_of_birth", "yob"],
    title: "Age discrimination via date of birth",
    severity: "medium",
    description: "Date of birth columns enable age discrimination, which is illegal in many jurisdictions.",
    realExample: "Many Indian job portals have been criticized for filtering out candidates above 35 using automated systems.",
    affectedGroups: ["Applicants over 40", "Fresh graduates under 22", "Career changers"],
    recommendation: "Use age brackets instead of exact DOB. Remove DOB if not essential to the decision."
  }
];

const SEVERITY_CONFIG = {
  critical: { color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", label: "Critical" },
  high: { color: "#D97706", bg: "#FEF3C7", border: "#FDE68A", label: "High risk" },
  medium: { color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", label: "Medium" }
};

export default function CulturalBiasWarning({ columns, theme }) {
  const [expanded, setExpanded] = useState(null);
  const [dismissed, setDismissed] = useState([]);

  if (!columns || columns.length === 0) return null;

  const lowerCols = columns.map(c => c.toLowerCase().replace(/[_\s-]/g, "_"));

  const detected = CULTURAL_BIAS_PATTERNS.filter(pattern =>
    !dismissed.includes(pattern.id) &&
    pattern.trigger.some(trigger =>
      lowerCols.some(col => col.includes(trigger))
    )
  );

  if (detected.length === 0) return null;

  const criticalCount = detected.filter(d => d.severity === "critical").length;
  const highCount = detected.filter(d => d.severity === "high").length;

  return (
    <div style={{ background: theme.card,
      border: "2px solid #DC2626",
      borderRadius: 16, padding: "1.25rem",
      marginBottom: "1.5rem" }}>

      <div style={{ display: "flex", alignItems: "center",
        justifyContent: "space-between", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%",
            background: "#FEE2E2", display: "flex",
            alignItems: "center", justifyContent: "center",
            fontSize: 18 }}>
            ⚠️
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700,
              color: "#DC2626" }}>
              Cultural bias risk detected in your dataset
            </div>
            <div style={{ fontSize: 12, color: theme.muted }}>
              {detected.length} potential bias patterns found —
              {criticalCount > 0 && ` ${criticalCount} critical`}
              {highCount > 0 && ` ${highCount} high risk`}
            </div>
          </div>
        </div>
        <div style={{ fontSize: 11, padding: "4px 12px",
          borderRadius: 10, background: "#FEE2E2",
          color: "#DC2626", fontWeight: 600 }}>
          Review before analysis
        </div>
      </div>

      {detected.map((pattern, i) => {
        const config = SEVERITY_CONFIG[pattern.severity];
        const isExpanded = expanded === pattern.id;

        return (
          <div key={pattern.id} style={{ marginBottom: 8 }}>
            <div
              onClick={() => setExpanded(isExpanded ? null : pattern.id)}
              style={{ background: config.bg,
                border: "1px solid " + config.border,
                borderRadius: 10, padding: "10px 14px",
                cursor: "pointer",
                display: "flex", alignItems: "center",
                justifyContent: "space-between" }}>

              <div style={{ display: "flex",
                alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, padding: "2px 8px",
                  borderRadius: 8, background: config.color + "20",
                  color: config.color, fontWeight: 600 }}>
                  {config.label}
                </span>
                <span style={{ fontSize: 13, fontWeight: 500,
                  color: config.color }}>
                  {pattern.title}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center",
                gap: 8 }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDismissed([...dismissed, pattern.id]);
                  }}
                  style={{ fontSize: 11, color: theme.muted,
                    background: "transparent", border: "none",
                    cursor: "pointer", padding: "2px 8px" }}>
                  Dismiss
                </button>
                <span style={{ fontSize: 12, color: config.color }}>
                  {isExpanded ? "▲" : "▼"}
                </span>
              </div>
            </div>

            {isExpanded && (
              <div style={{ background: "#FFF5F5",
                border: "1px solid " + config.border,
                borderTop: "none",
                borderRadius: "0 0 10px 10px",
                padding: "12px 14px" }}>

                <p style={{ fontSize: 13, color: "#1F2937",
                  lineHeight: 1.7, margin: "0 0 10px" }}>
                  {pattern.description}
                </p>

                <div style={{ background: "#FFF7F7",
                  border: "1px solid " + config.border,
                  borderRadius: 8, padding: "10px 12px",
                  marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 600,
                    color: config.color, marginBottom: 4 }}>
                    Real documented case:
                  </div>
                  <div style={{ fontSize: 12, color: "#7F1D1D",
                    lineHeight: 1.6, fontStyle: "italic" }}>
                    "{pattern.realExample}"
                  </div>
                </div>

                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 600,
                    color: "#6B7280", marginBottom: 6,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em" }}>
                    Groups at risk:
                  </div>
                  <div style={{ display: "flex",
                    flexWrap: "wrap", gap: 6 }}>
                    {pattern.affectedGroups.map((g, gi) => (
                      <span key={gi} style={{ fontSize: 11,
                        padding: "2px 10px", borderRadius: 10,
                        background: config.color + "15",
                        color: config.color }}>
                        {g}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ background: "#F0FDF4",
                  border: "1px solid #BBF7D0",
                  borderRadius: 8, padding: "8px 12px" }}>
                  <div style={{ fontSize: 11, fontWeight: 600,
                    color: "#16A34A", marginBottom: 3 }}>
                    Recommendation:
                  </div>
                  <div style={{ fontSize: 12, color: "#166534",
                    lineHeight: 1.6 }}>
                    {pattern.recommendation}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
