import React, { useState } from "react";
import Papa from "papaparse";
import { analyzeBias } from "../utils/biasEngine";

export default function CompareDatasets({ theme, onClose }) {
  const [datasetA, setDatasetA] = useState(null);
  const [datasetB, setDatasetB] = useState(null);
  const [nameA, setNameA] = useState("");
  const [nameB, setNameB] = useState("");
  const [configA, setConfigA] = useState({ decisionCol: "", demoCols: [] });
  const [configB, setConfigB] = useState({ decisionCol: "", demoCols: [] });
  const [resultsA, setResultsA] = useState(null);
  const [resultsB, setResultsB] = useState(null);
  const [loading, setLoading] = useState(false);
  const [compared, setCompared] = useState(false);

  const parseFile = (file, setData, setName, setConfig) => {
    if (!file) return;
    setName(file.name);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const fields = results.meta.fields || [];
        setData({ rows: results.data, columns: fields });
        const name = file.name.toLowerCase();
        if (name.includes("compas")) {
          setConfig({ decisionCol: "two_year_recid", demoCols: ["race", "sex"] });
        } else if (name.includes("hiring")) {
          setConfig({ decisionCol: "hired", demoCols: ["gender", "age_group"] });
        } else if (name.includes("adult") || name.includes("income")) {
          setConfig({ decisionCol: "income", demoCols: ["sex", "race"] });
        }
      }
    });
  };

  const handleCompare = () => {
    if (!datasetA || !datasetB) return;
    if (!configA.decisionCol || !configB.decisionCol) return;
    setLoading(true);
    setTimeout(() => {
      const rA = analyzeBias(datasetA.rows, configA.decisionCol, configA.demoCols);
      const rB = analyzeBias(datasetB.rows, configB.decisionCol, configB.demoCols);
      setResultsA(rA);
      setResultsB(rB);
      setCompared(true);
      setLoading(false);
    }, 1000);
  };

  const scoreColor = (s) => s >= 80 ? "#16A34A" : s >= 60 ? "#D97706" : "#DC2626";
  const scoreBg = (s) => s >= 80 ? "#DCFCE7" : s >= 60 ? "#FEF3C7" : "#FEE2E2";
  const scoreLabel = (s) => s >= 80 ? "Compliant" : s >= 60 ? "Moderate risk" : "High risk";

  return (
    <div style={{ minHeight: "100vh", background: theme.bg, paddingTop: 72 }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem" }}>

        <div style={{ display: "flex", alignItems: "center",
          justifyContent: "space-between", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 600,
              color: theme.text, margin: 0 }}>
              Dataset comparison
            </h1>
            <p style={{ fontSize: 13, color: theme.muted, marginTop: 4 }}>
              Compare two datasets side by side — before and after applying fixes
            </p>
          </div>
          <button onClick={onClose}
            style={{ padding: "8px 20px", borderRadius: 8, fontSize: 13,
              fontWeight: 500, cursor: "pointer",
              border: "1px solid " + theme.border,
              background: "transparent", color: theme.text }}>
            Back
          </button>
        </div>

        {!compared ? (
          <div style={{ display: "grid",
            gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: "1.5rem" }}>
            {[
              { label: "Dataset A", name: nameA, data: datasetA,
                config: configA, setConfig: setConfigA,
                setData: setDatasetA, setName: setNameA,
                color: "#3B82F6", hint: "Upload your original dataset" },
              { label: "Dataset B", name: nameB, data: datasetB,
                config: configB, setConfig: setConfigB,
                setData: setDatasetB, setName: setNameB,
                color: "#8B5CF6", hint: "Upload your improved dataset" }
            ].map((d, i) => (
              <div key={i} style={{ background: theme.card,
                border: "1px solid " + theme.border,
                borderRadius: 16, padding: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center",
                  gap: 8, marginBottom: "1rem" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%",
                    background: d.color }} />
                  <h3 style={{ fontSize: 14, fontWeight: 600,
                    color: theme.text, margin: 0 }}>{d.label}</h3>
                  <span style={{ fontSize: 12, color: theme.muted }}>
                    {d.hint}
                  </span>
                </div>

                <label style={{ display: "block", border: "2px dashed " +
                  (d.data ? d.color : theme.border), borderRadius: 10,
                  padding: "1.5rem", textAlign: "center", cursor: "pointer",
                  background: d.data ? d.color + "10" : theme.bg,
                  marginBottom: "1rem" }}>
                  <input type="file" accept=".csv"
                    style={{ display: "none" }}
                    onChange={e => parseFile(e.target.files[0],
                      d.setData, d.setName, d.setConfig)} />
                  {d.data ? (
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600,
                        color: d.color }}>{d.name}</div>
                      <div style={{ fontSize: 12, color: theme.muted,
                        marginTop: 4 }}>
                        {d.data.rows.length} rows · {d.data.columns.length} columns
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: 13, color: theme.muted }}>
                        Click to upload CSV
                      </div>
                    </div>
                  )}
                </label>

                {d.data && (
                  <div>
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ fontSize: 12, color: theme.muted,
                        display: "block", marginBottom: 4 }}>
                        Decision column
                      </label>
                      <select value={d.config.decisionCol}
                        onChange={e => d.setConfig({
                          ...d.config, decisionCol: e.target.value })}
                        style={{ width: "100%", padding: "6px 10px",
                          borderRadius: 8, border: "1px solid " + theme.border,
                          background: theme.card, color: theme.text,
                          fontSize: 13 }}>
                        <option value="">Select column...</option>
                        {d.data.columns.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: theme.muted,
                        display: "block", marginBottom: 4 }}>
                        Demographic columns
                      </label>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {d.data.columns
                          .filter(c => c !== d.config.decisionCol)
                          .filter(c => !["id","date","number","count",
                            "desc","case","jail","offense","arrest",
                            "custody","screen","event","start",
                            "end","first","last","name"]
                            .some(k => c.toLowerCase().includes(k)))
                          .slice(0, 12)
                          .map(col => (
                            <button key={col}
                              onClick={() => d.setConfig({
                                ...d.config,
                                demoCols: d.config.demoCols.includes(col)
                                  ? d.config.demoCols.filter(c => c !== col)
                                  : [...d.config.demoCols, col]
                              })}
                              style={{ padding: "4px 10px", borderRadius: 16,
                                fontSize: 12, cursor: "pointer",
                                border: d.config.demoCols.includes(col)
                                  ? "1px solid " + d.color
                                  : "1px solid " + theme.border,
                                background: d.config.demoCols.includes(col)
                                  ? d.color + "20" : "transparent",
                                color: d.config.demoCols.includes(col)
                                  ? d.color : theme.muted }}>
                              {d.config.demoCols.includes(col) ? "✓ " : ""}{col}
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div>
            <div style={{ display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              gap: 16, marginBottom: "1.5rem",
              alignItems: "center" }}>

              {[
                { r: resultsA, name: nameA, color: "#3B82F6", label: "Dataset A" },
                { r: resultsB, name: nameB, color: "#8B5CF6", label: "Dataset B" }
              ].map((d, idx) => (
                <React.Fragment key={idx}>
                  {idx === 1 && (
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 24, color: theme.muted }}>→</div>
                      {resultsB.fairnessScore > resultsA.fairnessScore ? (
                        <div style={{ fontSize: 12, fontWeight: 600,
                          color: "#16A34A", marginTop: 4 }}>
                          +{resultsB.fairnessScore - resultsA.fairnessScore} pts
                        </div>
                      ) : resultsB.fairnessScore < resultsA.fairnessScore ? (
                        <div style={{ fontSize: 12, fontWeight: 600,
                          color: "#DC2626", marginTop: 4 }}>
                          {resultsB.fairnessScore - resultsA.fairnessScore} pts
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, color: theme.muted,
                          marginTop: 4 }}>
                          No change
                        </div>
                      )}
                    </div>
                  )}
                  <div style={{ background: theme.card,
                    border: "2px solid " + d.color,
                    borderRadius: 16, padding: "1.5rem",
                    textAlign: "center" }}>
                    <div style={{ fontSize: 11, fontWeight: 600,
                      color: d.color, textTransform: "uppercase",
                      letterSpacing: "0.06em", marginBottom: 8 }}>
                      {d.label} — {d.name}
                    </div>
                    <div style={{ fontSize: 48, fontWeight: 700,
                      color: scoreColor(d.r.fairnessScore), lineHeight: 1 }}>
                      {d.r.fairnessScore}
                    </div>
                    <div style={{ fontSize: 13, color: theme.muted,
                      marginTop: 4 }}>/ 100</div>
                    <div style={{ marginTop: 10, display: "inline-block",
                      padding: "4px 14px", borderRadius: 20,
                      background: scoreBg(d.r.fairnessScore),
                      fontSize: 12, fontWeight: 500,
                      color: scoreColor(d.r.fairnessScore) }}>
                      {scoreLabel(d.r.fairnessScore)}
                    </div>
                    <div style={{ marginTop: 16, display: "grid",
                      gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {[
                        { label: "Parity gap",
                          value: (d.r.metrics?.demographicParity || 0) + "%" },
                        { label: "High risk groups",
                          value: d.r.groupResults.filter(
                            g => g.riskLevel === "high").length },
                        { label: "Stat. parity",
                          value: d.r.metrics?.statisticalParityRatio || "N/A" },
                        { label: "4/5ths rule",
                          value: d.r.metrics?.fourFifthsRule?.passes
                            ? "PASS" : "FAIL" }
                      ].map((m, mi) => (
                        <div key={mi} style={{ background: theme.bg,
                          borderRadius: 8, padding: "8px 10px",
                          textAlign: "center" }}>
                          <div style={{ fontSize: 10, color: theme.muted,
                            marginBottom: 2 }}>{m.label}</div>
                          <div style={{ fontSize: 14, fontWeight: 600,
                            color: theme.text }}>{m.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>

            <div style={{ background: theme.card,
              border: "1px solid " + theme.border,
              borderRadius: 16, padding: "1.25rem",
              marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: 14, fontWeight: 600,
                color: theme.text, marginBottom: "1rem" }}>
                Group comparison
              </h3>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%",
                  borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: theme.bg }}>
                      <th style={{ padding: "8px 12px", textAlign: "left",
                        color: theme.muted, fontWeight: 500,
                        borderBottom: "1px solid " + theme.border }}>
                        Group
                      </th>
                      <th style={{ padding: "8px 12px", textAlign: "center",
                        color: "#3B82F6", fontWeight: 500,
                        borderBottom: "1px solid " + theme.border }}>
                        Dataset A
                      </th>
                      <th style={{ padding: "8px 12px", textAlign: "center",
                        color: "#8B5CF6", fontWeight: 500,
                        borderBottom: "1px solid " + theme.border }}>
                        Dataset B
                      </th>
                      <th style={{ padding: "8px 12px", textAlign: "center",
                        color: theme.muted, fontWeight: 500,
                        borderBottom: "1px solid " + theme.border }}>
                        Change
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultsA.groupResults.map((gA, i) => {
                      const gB = resultsB.groupResults.find(
                        g => g.group === gA.group && g.column === gA.column
                      );
                      const change = gB
                        ? gB.approvalRate - gA.approvalRate : null;
                      return (
                        <tr key={i} style={{
                          borderBottom: "1px solid " + theme.border }}>
                          <td style={{ padding: "8px 12px",
                            color: theme.text, fontWeight: 500 }}>
                            {gA.group}
                            <span style={{ fontSize: 11, color: theme.muted,
                              marginLeft: 6 }}>{gA.column}</span>
                          </td>
                          <td style={{ padding: "8px 12px",
                            textAlign: "center",
                            color: gA.riskLevel === "high" ? "#DC2626"
                              : gA.riskLevel === "medium" ? "#D97706"
                              : "#16A34A",
                            fontWeight: 600 }}>
                            {gA.approvalRate}%
                          </td>
                          <td style={{ padding: "8px 12px",
                            textAlign: "center",
                            color: gB
                              ? (gB.riskLevel === "high" ? "#DC2626"
                                : gB.riskLevel === "medium" ? "#D97706"
                                : "#16A34A")
                              : theme.muted,
                            fontWeight: 600 }}>
                            {gB ? gB.approvalRate + "%" : "N/A"}
                          </td>
                          <td style={{ padding: "8px 12px",
                            textAlign: "center" }}>
                            {change !== null ? (
                              <span style={{ fontSize: 12, fontWeight: 600,
                                padding: "2px 8px", borderRadius: 10,
                                background: change > 0 ? "#DCFCE7"
                                  : change < 0 ? "#FEE2E2" : theme.bg,
                                color: change > 0 ? "#16A34A"
                                  : change < 0 ? "#DC2626" : theme.muted }}>
                                {change > 0 ? "+" : ""}{change}%
                              </span>
                            ) : (
                              <span style={{ color: theme.muted }}>—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <button onClick={() => {
              setCompared(false);
              setResultsA(null);
              setResultsB(null);
            }}
              style={{ width: "100%", padding: "12px", borderRadius: 10,
                border: "1px solid " + theme.border,
                background: "transparent", cursor: "pointer",
                fontSize: 13, color: theme.muted }}>
              Compare different datasets
            </button>
          </div>
        )}

        {!compared && (
          <button
            onClick={handleCompare}
            disabled={!datasetA || !datasetB ||
              !configA.decisionCol || !configB.decisionCol || loading}
            style={{ width: "100%", padding: "14px", borderRadius: 10,
              fontSize: 15, fontWeight: 600, border: "none",
              cursor: datasetA && datasetB && configA.decisionCol
                && configB.decisionCol ? "pointer" : "not-allowed",
              background: datasetA && datasetB && configA.decisionCol
                && configB.decisionCol ? "#3B82F6" : theme.border,
              color: datasetA && datasetB && configA.decisionCol
                && configB.decisionCol ? "white" : theme.muted }}>
            {loading ? "Analyzing both datasets..." : "Compare datasets"}
          </button>
        )}
      </div>
    </div>
  );
}
