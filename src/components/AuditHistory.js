import React, { useEffect, useState } from "react";
import { getAudits } from "../firebase";

export default function AuditHistory({ user, onBack, onNewAudit, theme }) {
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAudits(user.uid).then(data => {
      setAudits(data);
      setLoading(false);
    });
  }, [user.uid]);

  const scoreColor = (s) => s >= 80 ? "#16A34A" : s >= 60 ? "#D97706" : "#DC2626";
  const statusLabel = (s) => s >= 80 ? "Compliant" : s >= 60 ? "Moderate Risk" : "High Risk";

  return (
    <div style={{ minHeight: "100vh", background: theme.bg, paddingTop: 56 }}>
      <div style={{ maxWidth: 750, margin: "0 auto", padding: "2rem 1rem" }}>

        <div style={{ display: "flex", alignItems: "center", 
          justifyContent: "space-between", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 600, color: theme.text, margin: 0 }}>
              Audit History
            </h1>
            <p style={{ fontSize: 13, color: theme.muted, marginTop: 4 }}>
              All your past bias audits — {audits.length} total
            </p>
          </div>
          <button onClick={onNewAudit}
            style={{ padding: "10px 20px", borderRadius: 8, fontSize: 13,
              fontWeight: 600, cursor: "pointer", border: "none",
              background: theme.accent, color: "white" }}>
            New Audit
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: theme.muted }}>
            Loading your audits...
          </div>
        ) : audits.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem",
            background: theme.card, borderRadius: 16,
            border: "1px solid " + theme.border }}>
            <p style={{ fontSize: 16, color: theme.text, marginBottom: 8 }}>
              No audits yet
            </p>
            <p style={{ fontSize: 13, color: theme.muted, marginBottom: 20 }}>
              Run your first bias audit to see it here
            </p>
            <button onClick={onNewAudit}
              style={{ padding: "10px 24px", borderRadius: 8, fontSize: 13,
                fontWeight: 600, cursor: "pointer", border: "none",
                background: theme.accent, color: "white" }}>
              Start First Audit
            </button>
          </div>
        ) : (
          <div>
            {audits.map((audit, i) => (
              <div key={audit.id} style={{
                background: theme.card, border: "1px solid " + theme.border,
                borderRadius: 12, padding: "1.25rem", marginBottom: 10,
                display: "flex", justifyContent: "space-between", 
                alignItems: "center"
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, 
                    color: theme.text, marginBottom: 4 }}>
                    {audit.fileName}
                  </div>
                  <div style={{ fontSize: 12, color: theme.muted }}>
                    {new Date(audit.timestamp).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit"
                    })}
                  </div>
                  {audit.geminiSummary && (
                    <div style={{ fontSize: 12, color: theme.muted, 
                      marginTop: 6, lineHeight: 1.5,
                      maxWidth: 400 }}>
                      {audit.geminiSummary.substring(0, 100)}...
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 24, fontWeight: 700, 
                      color: scoreColor(audit.fairnessScore) }}>
                      {audit.fairnessScore}
                    </div>
                    <div style={{ fontSize: 11, color: theme.muted }}>/ 100</div>
                  </div>
                  <div style={{ padding: "4px 12px", borderRadius: 20,
                    fontSize: 11, fontWeight: 500,
                    background: scoreColor(audit.fairnessScore) + "20",
                    color: scoreColor(audit.fairnessScore) }}>
                    {statusLabel(audit.fairnessScore)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
