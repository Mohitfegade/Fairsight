
import React from "react";

export default function LandingPage({ onGetStarted }) {
  return (
    <div style={{ fontFamily: "sans-serif", background: "#fff" }}>

      <div style={{ background: "#1E3A5F", padding: "12px 24px",
        display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: "white" }}>
          Fair<span style={{ color: "#60A5FA" }}>Sight</span>
        </span>
        <button onClick={onGetStarted} style={{ padding: "8px 20px",
          background: "#3B82F6", color: "white", border: "none",
          borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
          Start Free Audit
        </button>
      </div>

      <div style={{ background: "linear-gradient(135deg, #1E3A5F 0%, #1E40AF 100%)",
        padding: "80px 24px", textAlign: "center" }}>
        <div style={{ display: "inline-block", background: "rgba(96,165,250,0.2)",
          color: "#93C5FD", padding: "6px 16px", borderRadius: 20,
          fontSize: 13, marginBottom: 24, fontWeight: 500 }}>
          Solution Challenge 2026 India — Unbiased AI Decision Track
        </div>
        <h1 style={{ fontSize: 48, fontWeight: 800, color: "white",
          margin: "0 0 16px", lineHeight: 1.2, maxWidth: 700, marginLeft: "auto", marginRight: "auto" }}>
          Catch the bias.<br />
          <span style={{ color: "#60A5FA" }}>Before it catches someone.</span>
        </h1>
        <p style={{ fontSize: 18, color: "#93C5FD", maxWidth: 600,
          margin: "0 auto 32px", lineHeight: 1.7 }}>
          FairSight detects hidden discrimination in AI decision systems
          in seconds — for free, with zero technical knowledge required.
        </p>
        <button onClick={onGetStarted} style={{ padding: "16px 40px",
          background: "#3B82F6", color: "white", border: "none",
          borderRadius: 12, cursor: "pointer", fontSize: 16,
          fontWeight: 700, marginRight: 12 }}>
          Start Free Audit
        </button>
        <button onClick={onGetStarted} style={{ padding: "16px 40px",
          background: "transparent", color: "white",
          border: "2px solid rgba(255,255,255,0.3)",
          borderRadius: 12, cursor: "pointer", fontSize: 16, fontWeight: 600 }}>
          See Live Demo
        </button>
      </div>

      <div style={{ background: "#FEF2F2", padding: "48px 24px" }}>
        <p style={{ textAlign: "center", fontSize: 13, fontWeight: 600,
          color: "#DC2626", textTransform: "uppercase", letterSpacing: "0.08em",
          marginBottom: 32 }}>
          Real scandals that FairSight would have caught
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20, maxWidth: 960, margin: "0 auto" }}>
          {[
            { company: "Amazon", year: "2018", title: "AI hiring tool discriminated against women",
              desc: "Amazon's resume screening AI taught itself to penalize resumes containing the word 'women'. It was scrapped after years of biased hiring decisions." },
            { company: "US Courts", year: "2016", title: "COMPAS algorithm showed racial bias",
              desc: "A court sentencing algorithm rated Black defendants twice as likely to reoffend as white defendants with identical profiles. Used in real sentencing." },
            { company: "US Hospitals", year: "2019", title: "Healthcare AI gave less care to Black patients",
              desc: "A widely used hospital algorithm systematically gave lower care priority to Black patients vs white patients with the same health conditions." }
          ].map((item, i) => (
            <div key={i} style={{ background: "white", borderRadius: 12,
              padding: "1.25rem", border: "1px solid #FECACA" }}>
              <div style={{ display: "flex", justifyContent: "space-between",
                alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#DC2626" }}>
                  {item.company}
                </span>
                <span style={{ fontSize: 11, color: "#9CA3AF" }}>{item.year}</span>
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#111",
                marginBottom: 8 }}>{item.title}</p>
              <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6,
                margin: 0 }}>{item.desc}</p>
              <div style={{ marginTop: 12, fontSize: 12, fontWeight: 600,
                color: "#16A34A" }}>
                FairSight would have caught this in 10 seconds
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "64px 24px", background: "#F9FAFB" }}>
        <h2 style={{ textAlign: "center", fontSize: 32, fontWeight: 700,
          color: "#111", marginBottom: 48 }}>How it works</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 32, maxWidth: 800, margin: "0 auto" }}>
          {[
            { step: "01", title: "Upload your dataset",
              desc: "Drag and drop any CSV file — loan decisions, hiring outcomes, medical records. Your data never leaves your browser." },
            { step: "02", title: "Get your fairness score",
              desc: "FairSight scans every demographic group and gives you a fairness score from 0 to 100 in seconds." },
            { step: "03", title: "Fix and download report",
              desc: "Get AI-powered fix recommendations and download a compliance PDF ready to show regulators or investors." }
          ].map((item, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%",
                background: "#EFF6FF", display: "flex", alignItems: "center",
                justifyContent: "center", margin: "0 auto 16px",
                fontSize: 18, fontWeight: 800, color: "#3B82F6" }}>
                {item.step}
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111",
                marginBottom: 8 }}>{item.title}</h3>
              <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7,
                margin: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "48px 24px", background: "white" }}>
        <h2 style={{ textAlign: "center", fontSize: 28, fontWeight: 700,
          color: "#111", marginBottom: 32 }}>
          Why FairSight beats every existing tool
        </h2>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          {[
            { them: "IBM AIF360", gap: "Requires Python, pip, 15 dependencies, 2 hours to install",
              us: "Open a website. Upload a CSV. Done." },
            { them: "Google What-If Tool", gap: "For ML engineers only, no plain English explanation",
              us: "Anyone can use it — HR managers, compliance officers, NGOs" },
            { them: "Microsoft Fairlearn", gap: "Raw statistical output, no actionable guidance",
              us: "Gemini AI explains the bias and tells you exactly how to fix it" },
            { them: "All existing tools", gap: "No compliance report, no regulatory context",
              us: "One-click PDF audit trail referencing EU AI Act and India DPDP Act 2023" }
          ].map((item, i) => (
            <div key={i} style={{ display: "grid",
              gridTemplateColumns: "1fr 1fr", gap: 0,
              marginBottom: 12, borderRadius: 10, overflow: "hidden",
              border: "1px solid #E5E7EB" }}>
              <div style={{ padding: "12px 16px", background: "#FEF2F2" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#DC2626",
                  marginBottom: 4 }}>{item.them}</div>
                <div style={{ fontSize: 13, color: "#6B7280" }}>{item.gap}</div>
              </div>
              <div style={{ padding: "12px 16px", background: "#F0FDF4" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#16A34A",
                  marginBottom: 4 }}>FairSight</div>
                <div style={{ fontSize: 13, color: "#374151" }}>{item.us}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: "#1E3A5F", padding: "64px 24px",
        textAlign: "center" }}>
        <h2 style={{ fontSize: 36, fontWeight: 800, color: "white",
          marginBottom: 16 }}>
          Ready to audit your AI?
        </h2>
        <p style={{ color: "#93C5FD", fontSize: 16, marginBottom: 32 }}>
          Free. No sign-up required. Your data never leaves your browser.
        </p>
        <button onClick={onGetStarted} style={{ padding: "16px 48px",
          background: "#3B82F6", color: "white", border: "none",
          borderRadius: 12, cursor: "pointer", fontSize: 18,
          fontWeight: 700 }}>
          Start Free Audit Now
        </button>
        <p style={{ color: "#60A5FA", fontSize: 12, marginTop: 48 }}>
          Built for Solution Challenge 2026 India — Unbiased AI Decision Track
          — Powered by Gemini and Firebase
        </p>
      </div>

    </div>
  );
}