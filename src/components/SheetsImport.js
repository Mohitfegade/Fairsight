import React, { useState } from "react";
import Papa from "papaparse";

export default function SheetsImport({ onDataLoaded, theme }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const extractSheetId = (url) => {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  };

  const extractGid = (url) => {
    const match = url.match(/gid=([0-9]+)/);
    return match ? match[1] : "0";
  };

  const handleImport = async () => {
    setError("");
    setSuccess("");
    const sheetId = extractSheetId(url);
    if (!sheetId) {
      setError("Invalid Google Sheets URL. Please paste a valid link.");
      return;
    }
    const gid = extractGid(url);
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
    setLoading(true);
    try {
      const res = await fetch(csvUrl);
      if (!res.ok) throw new Error("Sheet not accessible. Make sure it is set to 'Anyone with the link can view'.");
      const text = await res.text();
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (!results.data || results.data.length === 0) {
            setError("Sheet appears to be empty.");
            setLoading(false);
            return;
          }
          setSuccess("Loaded " + results.data.length + " rows from Google Sheets!");
          onDataLoaded({
            csvData: results.data,
            fileName: "google-sheet-" + sheetId.substring(0,8) + ".csv",
            columns: results.meta.fields || []
          });
          setLoading(false);
        },
        error: () => {
          setError("Failed to parse the sheet data.");
          setLoading(false);
        }
      });
    } catch (err) {
      setError(err.message || "Failed to load sheet. Check the URL and sharing settings.");
      setLoading(false);
    }
  };

  return (
    <div style={{ background: theme.card, border: "1px solid " + theme.border,
      borderRadius: 12, padding: "1.25rem", marginBottom: "1.5rem" }}>

      <div style={{ display: "flex", alignItems: "center", gap: 10,
        marginBottom: "1rem" }}>
        <div style={{ width: 32, height: 32, borderRadius: 8,
          background: "#E8F5E9", display: "flex", alignItems: "center",
          justifyContent: "center", flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M19 3H5C3.9 3 3 3.9 3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" fill="#34A853"/>
            <path d="M7 7h10v2H7zM7 11h10v2H7zM7 15h7v2H7z" fill="white"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: theme.text }}>
            Import from Google Sheets
          </div>
          <div style={{ fontSize: 12, color: theme.muted }}>
            Paste a public Google Sheets link to analyze it directly
          </div>
        </div>
      </div>

      <div style={{ background: "#FEF3C7", border: "1px solid #FDE68A",
        borderRadius: 8, padding: "8px 12px", marginBottom: "1rem",
        fontSize: 12, color: "#92400E" }}>
        Make sure your sheet is set to <strong>Anyone with the link can view</strong> before importing.
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          value={url}
          onChange={e => { setUrl(e.target.value); setError(""); }}
          placeholder="https://docs.google.com/spreadsheets/d/..."
          style={{ flex: 1, padding: "10px 14px", borderRadius: 8,
            border: "1px solid " + (error ? "#DC2626" : theme.border),
            background: theme.bg, color: theme.text, fontSize: 13,
            outline: "none" }}
        />
        <button
          onClick={handleImport}
          disabled={!url.trim() || loading}
          style={{ padding: "10px 20px", borderRadius: 8, fontSize: 13,
            fontWeight: 600, border: "none", cursor: url.trim() && !loading
              ? "pointer" : "not-allowed",
            background: url.trim() && !loading ? "#34A853" : theme.border,
            color: url.trim() && !loading ? "white" : theme.muted,
            whiteSpace: "nowrap", flexShrink: 0 }}>
          {loading ? "Importing..." : "Import sheet"}
        </button>
      </div>

      {error && (
        <div style={{ marginTop: 8, fontSize: 12, color: "#DC2626",
          display: "flex", alignItems: "center", gap: 6 }}>
          <span>⚠</span> {error}
        </div>
      )}

      {success && (
        <div style={{ marginTop: 8, fontSize: 12, color: "#16A34A",
          display: "flex", alignItems: "center", gap: 6 }}>
          <span>✓</span> {success}
        </div>
      )}

      <div style={{ marginTop: "1rem", padding: "10px 14px",
        background: theme.bg, borderRadius: 8,
        border: "1px solid " + theme.border }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: theme.muted,
          marginBottom: 6, textTransform: "uppercase",
          letterSpacing: "0.06em" }}>
          Try with a sample sheet
        </div>
        <button
          onClick={() => {
            setUrl("https://docs.google.com/spreadsheets/d/1Zo9hQKXnOXJf8wGBvHMPu_0M0qzYn8xF3hQM-_SAMPLE/edit");
            setError("Use your own Google Sheet — paste the URL above. Make sure sharing is set to Anyone with link.");
          }}
          style={{ fontSize: 12, color: theme.accent, background: "transparent",
            border: "none", cursor: "pointer", padding: 0,
            textDecoration: "underline" }}>
          How to prepare your Google Sheet for FairSight →
        </button>
      </div>
    </div>
  );
}
