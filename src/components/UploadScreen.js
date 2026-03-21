import React, { useState, useRef } from "react";
import Papa from "papaparse";

export default function UploadScreen({ onAnalyze }) {
  const [csvData, setCsvData] = useState(null);
  const [columns, setColumns] = useState([]);
  const [fileName, setFileName] = useState("");
  const [decisionCol, setDecisionCol] = useState("");
  const [demographicCols, setDemographicCols] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState([]);
  const fileRef = useRef();

  const handleFile = (file) => {
    if (!file || !file.name.endsWith(".csv")) return;
    setFileName(file.name);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setCsvData(results.data);
        setColumns(results.meta.fields || []);
        setPreview(results.data.slice(0, 5));
        setDecisionCol("");
        setDemographicCols([]);
      },
    });
  };

  const toggleDemographic = (col) => {
    setDemographicCols((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
  };

  const canAnalyze = csvData && decisionCol && demographicCols.length > 0;

  const handleAnalyze = () => {
    if (canAnalyze) onAnalyze({ csvData, decisionCol, demographicCols, fileName });
  };

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "2rem 1rem" }}>
      <div style={{ marginBottom: "2rem", textAlign: "center" }}>
        <h1 style={{ fontSize: 32, fontWeight: 600, color: "#111", marginBottom: 6 }}>
          Fair<span style={{ color: "#3B82F6" }}>Sight</span>
        </h1>
        <p style={{ color: "#6B7280", fontSize: 15 }}>
          Detect hidden bias in AI decision systems - in seconds
        </p>
      </div>

      <div style={{
        background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10,
        padding: "10px 16px", marginBottom: "1.5rem", display: "flex",
        alignItems: "center", gap: 10
      }}>
        <p style={{ fontSize: 13, color: "#1D4ED8", margin: 0 }}>
          Your data never leaves this browser. FairSight processes
          everything locally. Your CSV is never uploaded to any server.
        </p>
      </div>

      <div
        onClick={() => fileRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault(); setDragging(false);
          handleFile(e.dataTransfer.files[0]);
        }}
        style={{
          border: dragging ? "2px dashed #3B82F6" : "2px dashed #D1D5DB",
          borderRadius: 12, padding: "2.5rem", textAlign: "center",
          cursor: "pointer", background: dragging ? "#EFF6FF" : "#F9FAFB",
          marginBottom: "1.5rem"
        }}
      >
        <input ref={fileRef} type="file" accept=".csv"
          style={{ display: "none" }}
          onChange={(e) => handleFile(e.target.files[0])}
        />
        {fileName ? (
          <p style={{ fontWeight: 600, color: "#111" }}>{fileName} loaded</p>
        ) : (
          <>
            <p style={{ fontWeight: 600, color: "#374151", marginBottom: 4 }}>
              Drop your CSV file here
            </p>
            <p style={{ color: "#9CA3AF", fontSize: 13 }}>or click to browse</p>
          </>
        )}
      </div>

      {columns.length > 0 && (
        <div style={{
          background: "white", border: "1px solid #E5E7EB",
          borderRadius: 12, padding: "1.25rem", marginBottom: "1.5rem"
        }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: "1rem", color: "#111" }}>
            Configure your dataset
          </h2>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", display: "block", marginBottom: 6 }}>
              Which column is the decision? (approved / rejected / 1 / 0)
            </label>
            <select value={decisionCol} onChange={(e) => setDecisionCol(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8,
                border: "1px solid #D1D5DB", fontSize: 14, background: "white", color: "#111" }}>
              <option value="">Select a column...</option>
              {columns.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", display: "block", marginBottom: 6 }}>
              Which columns are demographic? (click all that apply)
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {columns.filter(c => c !== decisionCol).map((col) => (
                <button key={col} onClick={() => toggleDemographic(col)}
                  style={{ padding: "6px 14px", borderRadius: 20, fontSize: 13, cursor: "pointer",
                    border: demographicCols.includes(col) ? "1px solid #3B82F6" : "1px solid #D1D5DB",
                    background: demographicCols.includes(col) ? "#EFF6FF" : "white",
                    color: demographicCols.includes(col) ? "#1D4ED8" : "#374151" }}>
                  {demographicCols.includes(col) ? "+ " : ""}{col}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {preview.length > 0 && (
        <div style={{ marginBottom: "1.5rem", overflowX: "auto" }}>
          <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 8 }}>Preview - first 5 rows</p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>
                {columns.slice(0, 8).map((col) => (
                  <th key={col} style={{ padding: "6px 10px", background: "#F3F4F6",
                    textAlign: "left", border: "1px solid #E5E7EB", fontWeight: 500,
                    color: "#374151", whiteSpace: "nowrap" }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.map((row, i) => (
                <tr key={i}>
                  {columns.slice(0, 8).map((col) => (
                    <td key={col} style={{ padding: "5px 10px", border: "1px solid #E5E7EB",
                      color: "#111", whiteSpace: "nowrap" }}>{row[col]}</td>
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
            background: canAnalyze ? "#3B82F6" : "#E5E7EB",
            color: canAnalyze ? "white" : "#9CA3AF" }}>
          {canAnalyze ? "Analyze " + fileName + " for bias" : "Select a decision column and at least one demographic column"}
        </button>
      )}
    </div>
  );
}

