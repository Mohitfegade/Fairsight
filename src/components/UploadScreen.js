import React, { useState, useRef } from "react";
import Papa from "papaparse";
import SheetsImport from "./SheetsImport";

export default function UploadScreen({ onAnalyze, theme }) {
  const [csvData, setCsvData] = useState(null);
  const [columns, setColumns] = useState([]);
  const [fileName, setFileName] = useState("");
  const [decisionCol, setDecisionCol] = useState("");
  const [demographicCols, setDemographicCols] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState([]);
  const [showAllCols, setShowAllCols] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");
  const fileRef = useRef();

  const handleFile = (file) => {
    if (!file || !file.name.endsWith(".csv")) return;
    setFileName(file.name);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data;
        const fields = results.meta.fields || [];
        setCsvData(data);
        setColumns(fields);
        setPreview(data.slice(0, 5));

        const name = file.name.toLowerCase();
        if (name.includes("compas")) {
          setDecisionCol("two_year_recid");
          setDemographicCols(["race", "sex"]);
        } else if (name.includes("hiring")) {
          setDecisionCol("hired");
          setDemographicCols(["gender", "age_group"]);
        } else if (name.includes("adult") || name.includes("income")) {
          setDecisionCol("income");
          setDemographicCols(["sex", "race"]);
        } else if (name.includes("german") || name.includes("credit")) {
          setDecisionCol("Risk");
          setDemographicCols(["Sex", "Age"]);
        } else {
          const likelyDecision = fields.find(f =>
            ["decision","approved","hired","outcome","label",
             "result","target","class","risk","score"].some(k =>
              f.toLowerCase().includes(k))
          );
          const likelyDemo = fields.filter(f =>
            ["gender","sex","race","ethnicity","age","income",
             "nationality","religion","disability"].some(k =>
              f.toLowerCase().includes(k))
          );
          if (likelyDecision) setDecisionCol(likelyDecision);
          if (likelyDemo.length > 0) setDemographicCols(likelyDemo);
        }
      },
    });
  };

  const toggleDemographic = (col) => {
    setDemographicCols((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
  };

  const excludeWords = ["id", "date", "number", "count", "desc", "case", "jail", "offense", "arrest", "custody", "score", "screen", "event", "start", "end", "first", "last", "name"];
  
  const isLikelyDemographic = (colName) => {
    if (showAllCols) return true;
    const lower = colName.toLowerCase();
    return !excludeWords.some(w => lower.includes(w));
  };

  const canAnalyze = csvData && decisionCol && demographicCols.length > 0;

  const handleAnalyze = () => {
    if (canAnalyze) onAnalyze({ csvData, decisionCol, demographicCols, fileName });
  };

  return (
    <div style={{ minHeight: "100vh", background: theme.bg, maxWidth: 700, margin: "0 auto", padding: "2rem 1rem" }}>
      <div style={{ marginBottom: "2rem", textAlign: "center" }}>
        <h1 style={{ fontSize: 32, fontWeight: 600, color: theme.text, marginBottom: 6 }}>
          Fair<span style={{ color: theme.accent }}>Sight</span>
        </h1>
        <p style={{ color: theme.muted, fontSize: 15 }}>
          Detect hidden bias in AI decision systems - in seconds
        </p>
      </div>

      <div style={{
        background: theme.accent + "15", border: "1px solid " + theme.accent + "40", borderRadius: 10,
        padding: "10px 16px", marginBottom: "1.5rem", display: "flex",
        alignItems: "center", gap: 10
      }}>
        <span style={{ fontSize: 16, color: theme.accent }}>[secure]</span>
        <p style={{ fontSize: 13, color: theme.accent, margin: 0 }}>
          <strong>Your data never leaves this browser.</strong> FairSight processes
          everything locally. Your CSV is never uploaded to any server.
        </p>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: "1.5rem",
        flexWrap: "wrap" }}>
        {[
          { label: "Model-agnostic", desc: "Works with any AI system", color: "#7C3AED" },
          { label: "100% private", desc: "Data stays in browser", color: "#16A34A" },
          { label: "6 regulations", desc: "EU AI Act + India DPDP", color: "#DC2626" },
          { label: "Free forever", desc: "No sign-up required", color: "#0284C7" }
        ].map((b, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6,
            padding: "5px 12px", borderRadius: 20, fontSize: 12,
            border: "1px solid " + b.color + "40",
            background: b.color + "10" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%",
              background: b.color, flexShrink: 0 }} />
            <span style={{ fontWeight: 600, color: b.color }}>{b.label}</span>
            <span style={{ color: theme.muted }}>— {b.desc}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: "1.5rem",
        background: theme.bg, borderRadius: 10, padding: 4,
        border: "1px solid " + theme.border }}>
        {[
          { id: "upload", label: "Upload CSV" },
          { id: "sheets", label: "Google Sheets" }
        ].map(tab => (
          <button key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{ flex: 1, padding: "8px", borderRadius: 8,
              border: "none", cursor: "pointer", fontSize: 13,
              fontWeight: activeTab === tab.id ? 600 : 400,
              background: activeTab === tab.id ? theme.card : "transparent",
              color: activeTab === tab.id ? theme.text : theme.muted,
              transition: "all 0.15s" }}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "sheets" ? (
        <SheetsImport
          theme={theme}
          onDataLoaded={({ csvData, fileName, columns }) => {
            setCsvData(csvData);
            setFileName(fileName);
            setColumns(columns);
            setPreview(csvData.slice(0, 5));
            const name = fileName.toLowerCase();
            if (name.includes("compas")) {
              setDecisionCol("two_year_recid");
              setDemographicCols(["race", "sex"]);
            } else {
              const likelyDecision = columns.find(f =>
                ["decision","approved","hired","outcome","label",
                 "result","target","class","risk","score"].some(k =>
                  f.toLowerCase().includes(k))
              );
              const likelyDemo = columns.filter(f =>
                ["gender","sex","race","ethnicity","age","income",
                 "nationality","religion","disability"].some(k =>
                  f.toLowerCase().includes(k))
              );
              if (likelyDecision) setDecisionCol(likelyDecision);
              if (likelyDemo.length > 0) setDemographicCols(likelyDemo);
            }
            setActiveTab("upload");
          }}
        />
      ) : (
        <>
          <hr style={{ border: "none", borderTop: "1px solid " + theme.border, margin: "0 0 2rem" }} />

      <div
        onClick={() => fileRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault(); setDragging(false);
          handleFile(e.dataTransfer.files[0]);
        }}
        style={{
          border: dragging ? "2px dashed " + theme.accent : "2px dashed " + theme.border,
          borderRadius: 12, padding: "2.5rem", textAlign: "center",
          cursor: "pointer", background: dragging ? theme.accent + "15" : theme.bg,
          marginBottom: "2rem"
        }}
      >
        <input ref={fileRef} type="file" accept=".csv"
          style={{ display: "none" }}
          onChange={(e) => handleFile(e.target.files[0])}
        />
        {fileName ? (
          <p style={{ fontWeight: 600, color: theme.text }}>{fileName} loaded</p>
        ) : (
          <>
            <p style={{ fontWeight: 600, color: theme.text, marginBottom: 4 }}>
              Drop your CSV file here
            </p>
            <p style={{ color: theme.muted, fontSize: 13 }}>or click to browse</p>
          </>
        )}
      </div>

      {!csvData && (
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <p style={{ fontSize: 13, color: theme.muted, marginBottom: 10 }}>
            No dataset? Try with real sample data:
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={async () => {
                const res = await fetch("https://raw.githubusercontent.com/propublica/compas-analysis/master/compas-scores-two-years.csv");
                const blob = await res.blob();
                handleFile(new File([blob], "compas-sample.csv", { type: "text/csv" }));
              }}
              style={{ padding: "10px 20px", borderRadius: 8, fontSize: 13,
                fontWeight: 600, cursor: "pointer", border: "none",
                background: "#DC2626", color: "white" }}
            >
              COMPAS Criminal Justice Dataset
            </button>
            <button
              onClick={async () => {
                const res = await fetch("/hiring-sample.csv");
                const blob = await res.blob();
                handleFile(new File([blob], "hiring-sample.csv", { type: "text/csv" }));
              }}
              style={{ padding: "10px 20px", borderRadius: 8, fontSize: 13,
                fontWeight: 600, cursor: "pointer", border: "none",
                background: "#7C3AED", color: "white" }}
            >
              Hiring Bias Dataset
            </button>
          </div>
          <p style={{ fontSize: 11, color: theme.muted, marginTop: 8 }}>
            COMPAS — racial bias in US courts | Hiring — gender bias in recruitment
          </p>
        </div>
      )}

      {columns.length > 0 && (
        <div style={{
          background: theme.card, border: "1px solid " + theme.border,
          borderRadius: 12, padding: "1.25rem", marginBottom: "2rem"
        }}>
          <div style={{ marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: theme.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Step 2 of 2</span>
          </div>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: "1rem", color: theme.text }}>
            Configure your dataset
          </h2>
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: theme.text, display: "block", marginBottom: 6 }}>
              Which column is the decision? (approved / rejected / 1 / 0)
            </label>
            <select value={decisionCol} onChange={(e) => setDecisionCol(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8,
                border: "1px solid " + theme.border, fontSize: 14, background: theme.card, color: theme.text }}>
              <option value="">Select a column...</option>
              {columns.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <p style={{ fontSize: 12, color: theme.muted, marginTop: 6, marginBottom: 0 }}>
              This is the column that contains the final decision — usually contains values like 1/0, yes/no, approved/rejected
            </p>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: theme.text, display: "block", marginBottom: 6 }}>
              Which columns are demographic? (click all that apply)
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {columns.filter(c => c !== decisionCol && isLikelyDemographic(c)).map((col) => (
                <button key={col} onClick={() => toggleDemographic(col)}
                  style={{ padding: "6px 14px", borderRadius: 20, fontSize: 13, cursor: "pointer",
                    border: demographicCols.includes(col) ? "1px solid " + theme.accent : "1px solid " + theme.border,
                    background: demographicCols.includes(col) ? theme.accent + "15" : theme.card,
                    color: demographicCols.includes(col) ? theme.accent : theme.text }}>
                  {demographicCols.includes(col) ? "✓ " : ""}{col}
                </button>
              ))}
            </div>
            {!showAllCols && columns.filter(c => c !== decisionCol && !isLikelyDemographic(c)).length > 0 && (
              <div style={{ marginTop: 12, textAlign: "left" }}>
                <button onClick={() => setShowAllCols(true)} style={{ background: "none", border: "none", color: theme.accent, fontSize: 13, cursor: "pointer", textDecoration: "underline", padding: 0 }}>
                  Show all columns
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {preview.length > 0 && (
        <div style={{ marginBottom: "2rem", overflowX: "auto" }}>
          <p style={{ fontSize: 13, color: theme.muted, marginBottom: 8 }}>Preview - first 5 rows</p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>
                {columns.slice(0, 8).map((col) => (
                  <th key={col} style={{ padding: "6px 10px", background: theme.card,
                    textAlign: "left", border: "1px solid " + theme.border, fontWeight: 500,
                    color: theme.muted, whiteSpace: "nowrap" }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.map((row, i) => (
                <tr key={i}>
                  {columns.slice(0, 8).map((col) => (
                    <td key={col} style={{ padding: "5px 10px", border: "1px solid " + theme.border,
                      color: theme.text, whiteSpace: "nowrap" }}>{row[col]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {csvData && (
        <button onClick={handleAnalyze} disabled={!canAnalyze}
          style={{ width: "100%", padding: "14px", borderRadius: 10, fontSize: 15,
            fontWeight: 600, border: "none", cursor: canAnalyze ? "pointer" : "not-allowed",
            background: canAnalyze ? theme.accent : theme.border,
            color: canAnalyze ? "#FFFFFF" : theme.muted }}>
          {canAnalyze ? "Analyze " + fileName + " for bias" : "Select a decision column and at least one demographic column"}
        </button>
      )}
      </>
      )}
    </div>
  );
}
