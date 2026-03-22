import jsPDF from "jspdf";

export function generateComplianceReport(fileName, biasResults, geminiResults) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const PW = 210;
  const PH = 297;
  const ML = 16;
  const MR = 16;
  const CW = PW - ML - MR;
  let y = 0;

  const auditId = "FS-" + Date.now().toString(36).toUpperCase();
  const score = biasResults.fairnessScore;
  const highRisk = biasResults.groupResults.filter(g => g.riskLevel === "high");
  const scoreColor = score >= 80 ? [22,163,74] : score >= 60 ? [217,119,6] : [220,38,38];
  const statusText = score >= 80 ? "COMPLIANT" : score >= 60 ? "MODERATE RISK" : "HIGH RISK";
  const dateStr = new Date().toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" });

  const C = {
    navy: [10,18,35], blue: [37,99,235], lightBlue: [219,234,254],
    red: [220,38,38], lightRed: [254,226,226],
    orange: [217,119,6], lightOrange: [254,243,199],
    green: [22,163,74], lightGreen: [220,252,231],
    gray: [71,85,105], lightGray: [241,245,249],
    border: [214,221,231], white: [255,255,255],
    text: [15,23,42], muted: [100,116,139], subtle: [148,163,184]
  };

  const setF = (size, style="normal", color=C.text) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", style);
    doc.setTextColor(...color);
  };
  const fillR = (x,y,w,h,color,r=0) => {
    doc.setFillColor(...color);
    r > 0 ? doc.roundedRect(x,y,w,h,r,r,"F") : doc.rect(x,y,w,h,"F");
  };
  const strokeR = (x,y,w,h,color,lw=0.3,r=0) => {
    doc.setDrawColor(...color);
    doc.setLineWidth(lw);
    r > 0 ? doc.roundedRect(x,y,w,h,r,r,"S") : doc.rect(x,y,w,h,"S");
  };
  const txt = (t,x,y,opts={}) => doc.text(String(t),x,y,opts);
  const wrapTxt = (t,x,y,maxW,lh=4.5) => {
    const lines = doc.splitTextToSize(String(t),maxW);
    lines.forEach((l,i) => doc.text(l,x,y+i*lh));
    return lines.length * lh;
  };

  let pageNum = 0;
  const addPage = () => {
    if(pageNum > 0) doc.addPage();
    pageNum++;
    y = 0;
    drawPageChrome();
  };
  const check = (needed) => { if(y + needed > PH - 18) addPage(); };

  const drawPageChrome = () => {
    if(pageNum === 1) return;
    fillR(0, 0, PW, 12, C.navy);
    fillR(0, 0, 4, 12, C.blue);
    setF(6, "bold", C.white);
    txt("FAIRSIGHT AI BIAS AUDIT REPORT", ML+4, 8);
    setF(6, "normal", C.subtle);
    txt(auditId, PW-MR, 8, {align:"right"});
    fillR(0, PH-10, PW, 10, C.lightGray);
    strokeR(0, PH-10, PW, 0.3, C.border, 0.3);
    setF(6, "normal", C.muted);
    txt("Confidential — For internal compliance use only", ML, PH-4);
    setF(6, "bold", C.text);
    txt("Page " + pageNum, PW/2, PH-4, {align:"center"});
    txt(dateStr, PW-MR, PH-4, {align:"right"});
    y = 18;
  };

  const drawHorizBar = (x, barY, w, value, maxVal, color, bgColor) => {
    fillR(x, barY, w, 4, bgColor, 2);
    const filled = Math.max(2, (value/maxVal) * w);
    fillR(x, barY, filled, 4, color, 2);
  };

  // ═══════════════════════════════════════════
  // PAGE 1 — PREMIUM COVER
  // ═══════════════════════════════════════════
  addPage();

  fillR(0, 0, PW, PH, C.navy);
  fillR(0, 0, PW, 110, C.blue);
  fillR(0, 105, PW, 8, [30,64,175]);
  fillR(0, 0, 6, PH, [99,131,247]);

  setF(9, "bold", C.white);
  fillR(ML+6, 14, 32, 9, [255,255,255], 2);
  setF(8, "bold", C.blue);
  txt("FairSight", ML+22, 20, {align:"center"});

  setF(30, "bold", C.white);
  txt("AI Bias", ML+6, 52);
  setF(30, "bold", [147,197,253]);
  txt("Audit Report", ML+6, 68);

  setF(9, "normal", [147,197,253]);
  txt("Automated Fairness Analysis powered by Gemini AI", ML+6, 78);
  setF(7.5, "normal", [99,131,247]);
  txt("Solution Challenge 2026 India — Unbiased AI Decision Track", ML+6, 86);

  const scoreBoxX = ML+6;
  const scoreBoxY = 118;
  fillR(scoreBoxX, scoreBoxY, 88, 42, [20,30,55], 3);
  fillR(scoreBoxX, scoreBoxY, 88, 3, scoreColor);
  setF(7, "bold", C.subtle);
  txt("OVERALL FAIRNESS SCORE", scoreBoxX+44, scoreBoxY+10, {align:"center"});
  setF(30, "bold", scoreColor);
  txt(String(score), scoreBoxX+28, scoreBoxY+28, {align:"center"});
  setF(11, "normal", C.subtle);
  txt("/ 100", scoreBoxX+46, scoreBoxY+28);
  fillR(scoreBoxX+8, scoreBoxY+32, 72, 6, scoreColor, 2);
  setF(7, "bold", C.white);
  txt(statusText, scoreBoxX+44, scoreBoxY+37, {align:"center"});

  const infoBoxX = ML+6+92;
  const infoBoxY = 118;
  fillR(infoBoxX, infoBoxY, CW-92, 42, [20,30,55], 3);
  fillR(infoBoxX, infoBoxY, CW-92, 3, C.subtle);
  const rows = [
    ["DATASET", fileName.length>28 ? fileName.substring(0,28)+"..." : fileName],
    ["AUDIT DATE", dateStr],
    ["AUDIT ID", auditId],
    ["PLATFORM", "FairSight v2.0"]
  ];
  rows.forEach((r,i) => {
    setF(6, "bold", C.subtle);
    txt(r[0], infoBoxX+5, infoBoxY+10+i*8);
    setF(7, "normal", C.white);
    txt(r[1], infoBoxX+32, infoBoxY+10+i*8);
    if(i<3) {
      doc.setDrawColor(...[30,45,70]);
      doc.setLineWidth(0.2);
      doc.line(infoBoxX+4, infoBoxY+13+i*8, infoBoxX+CW-96, infoBoxY+13+i*8);
    }
  });

  const statY = 172;
  fillR(ML+6, statY, CW, 32, [20,30,55], 3);
  fillR(ML+6, statY, CW, 3, C.blue);
  setF(7, "bold", C.subtle);
  txt("KEY METRICS AT A GLANCE", ML+6+CW/2, statY+10, {align:"center"});

  const stats = [
    {label:"Groups", value:biasResults.groupResults.length, color:C.blue},
    {label:"High Risk", value:highRisk.length, color:C.red},
    {label:"Parity Gap", value:(biasResults.metrics?.demographicParity||0)+"%", color:scoreColor},
    {label:"4/5ths Rule", value:biasResults.metrics?.fourFifthsRule?.passes?"PASS":"FAIL", color:biasResults.metrics?.fourFifthsRule?.passes?C.green:C.red}
  ];
  const sw = CW/4;
  stats.forEach((s,i) => {
    const sx = ML+6 + i*sw;
    setF(12, "bold", s.color);
    txt(String(s.value), sx+sw/2, statY+24, {align:"center"});
    setF(6, "normal", C.subtle);
    txt(s.label, sx+sw/2, statY+29, {align:"center"});
    if(i<3) {
      doc.setDrawColor(...[30,45,70]);
      doc.setLineWidth(0.3);
      doc.line(sx+sw, statY+8, sx+sw, statY+30);
    }
  });

  fillR(ML+6, 218, CW, 0.3, [30,45,70]);

  setF(8, "bold", C.subtle);
  txt('"Catch the bias. Before it catches someone."', PW/2, 232, {align:"center"});
  setF(7, "normal", [50,65,90]);
  txt("Powered by Google Gemini API & Firebase Hosting", PW/2, 240, {align:"center"});

  setF(6, "normal", [30,45,70]);
  txt("All CSV processing is done locally in the browser. Your data never leaves your device.", PW/2, PH-16, {align:"center"});
  setF(7, "bold", C.subtle);
  txt("FairSight Confidential Bias Audit Report — " + auditId, PW/2, PH-10, {align:"center"});

  // ═══════════════════════════════════════════
  // PAGE 2 — EXECUTIVE SUMMARY
  // ═══════════════════════════════════════════
  addPage();

  setF(14, "bold", C.text);
  txt("Executive Summary", ML, y);
  setF(8, "normal", C.muted);
  txt("High-level overview of bias findings and risk assessment", ML, y+6);
  doc.setDrawColor(...C.blue);
  doc.setLineWidth(0.5);
  doc.line(ML, y+9, ML+CW, y+9);
  y += 16;

  fillR(ML, y, CW, 28, score>=80?C.lightGreen:score>=60?C.lightOrange:C.lightRed, 3);
  fillR(ML, y, 4, 28, scoreColor);
  strokeR(ML, y, CW, 28, scoreColor, 0.4, 3);

  setF(24, "bold", scoreColor);
  txt(String(score), ML+20, y+17, {align:"center"});
  setF(8, "normal", C.muted);
  txt("/ 100", ML+30, y+17);

  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.3);
  doc.line(ML+50, y+5, ML+50, y+23);

  setF(11, "bold", scoreColor);
  txt(statusText, ML+56, y+12);
  setF(7.5, "normal", C.muted);
  txt("Overall Fairness Assessment", ML+56, y+18);
  setF(7, "normal", C.text);
  const verdict = score>=80 ? "Dataset meets recommended fairness thresholds." : score>=60 ? "Moderate bias detected. Corrective action recommended before deployment." : "Significant bias detected. Immediate remediation required.";
  txt(verdict, ML+56, y+24);
  y += 36;

  const mc = [
    {label:"Demographic Parity Gap", value:(biasResults.metrics?.demographicParity||0)+"%", sub:"Max approval rate spread", color:(biasResults.metrics?.demographicParity||0)>20?C.red:C.green},
    {label:"Statistical Parity Ratio", value:String(biasResults.metrics?.statisticalParityRatio||"N/A"), sub:"Min/max ratio (1.0 = perfect)", color:(biasResults.metrics?.statisticalParityRatio||1)<0.8?C.red:C.green},
    {label:"4/5ths Rule", value:biasResults.metrics?.fourFifthsRule?.passes?"PASS":"FAIL", sub:(biasResults.metrics?.fourFifthsRule?.violations?.length||0)+" group violations", color:biasResults.metrics?.fourFifthsRule?.passes?C.green:C.red},
    {label:"High Risk Groups", value:String(highRisk.length), sub:"Require immediate action", color:highRisk.length>0?C.red:C.green}
  ];
  const mcW = (CW-6)/4;
  mc.forEach((m,i) => {
    const mx = ML + i*(mcW+2);
    fillR(mx, y, mcW, 26, C.lightGray, 3);
    strokeR(mx, y, mcW, 26, C.border, 0.3, 3);
    fillR(mx, y, mcW, 3, m.color);
    setF(6, "bold", C.muted);
    const lbl = doc.splitTextToSize(m.label, mcW-6);
    lbl.forEach((l,li) => txt(l, mx+mcW/2, y+8+li*3.5, {align:"center"}));
    setF(12, "bold", m.color);
    txt(m.value, mx+mcW/2, y+21, {align:"center"});
    setF(5.5, "normal", C.muted);
    txt(m.sub, mx+mcW/2, y+25.5, {align:"center"});
  });
  y += 34;

  fillR(ML, y, CW, 7, C.blue, 2);
  setF(7.5, "bold", C.white);
  txt("GEMINI AI ANALYSIS", ML+5, y+5);
  const gsrc = geminiResults?._source === "gemini" ? "Live AI" : "Estimated";
  const gsrcColor = geminiResults?._source === "gemini" ? C.green : C.orange;
  fillR(PW-MR-22, y+1, 18, 5, gsrcColor, 2);
  setF(5.5, "bold", C.white);
  txt(gsrc, PW-MR-13, y+4.8, {align:"center"});
  y += 11;

  fillR(ML, y, CW, 36, C.lightBlue, 3);
  strokeR(ML, y, CW, 36, [147,197,253], 0.4, 3);
  fillR(ML, y, 4, 36, C.blue);

  setF(7.5, "normal", C.text);
  const sumText = geminiResults?.summary || biasResults.rawSummary;
  const sumLines = doc.splitTextToSize(sumText, CW-14);
  sumLines.slice(0,4).forEach((l,i) => txt(l, ML+8, y+8+i*4.5));

  if(geminiResults?.rootCause) {
    setF(7, "bold", C.blue);
    txt("Root Cause: ", ML+8, y+30);
    setF(7, "normal", C.text);
    const rc = doc.splitTextToSize(geminiResults.rootCause, CW-45);
    txt(rc[0]||"", ML+30, y+30);
  }
  y += 44;

  setF(11, "bold", C.text);
  txt("Risk Distribution by Group", ML, y);
  y += 8;

  biasResults.groupResults.forEach(g => {
    check(12);
    const rC = g.riskLevel==="high"?C.red:g.riskLevel==="medium"?C.orange:C.green;
    const rL = g.riskLevel==="high"?C.lightRed:g.riskLevel==="medium"?C.lightOrange:C.lightGreen;
    const rT = g.riskLevel==="high"?"HIGH":g.riskLevel==="medium"?"MED":"OK";

    setF(7.5, "bold", C.text);
    txt(g.group, ML, y+4);
    setF(6.5, "normal", C.muted);
    txt(g.column, ML+38, y+4);

    const barX = ML+65;
    const barW = CW-100;
    drawHorizBar(barX, y+1, barW, g.approvalRate, 100, rC, C.border);

    setF(7, "bold", rC);
    txt(g.approvalRate+"%", barX+barW+4, y+5);

    fillR(PW-MR-16, y-1, 14, 7, rL, 2);
    setF(5.5, "bold", rC);
    txt(rT, PW-MR-9, y+4, {align:"center"});
    y += 10;
  });

  // ═══════════════════════════════════════════
  // PAGE 3 — DETAILED FINDINGS
  // ═══════════════════════════════════════════
  addPage();

  setF(14, "bold", C.text);
  txt("Detailed Findings", ML, y);
  setF(8, "normal", C.muted);
  txt("Group-by-group bias analysis with approval rates and disparity metrics", ML, y+6);
  doc.setDrawColor(...C.blue);
  doc.setLineWidth(0.5);
  doc.line(ML, y+9, ML+CW, y+9);
  y += 16;

  fillR(ML, y, CW, 8, C.navy);
  const tcols = [
    {label:"GROUP", x:ML+3, w:36},
    {label:"COLUMN", x:ML+40, w:26},
    {label:"RECORDS", x:ML+68, w:22},
    {label:"APPROVAL RATE", x:ML+92, w:32},
    {label:"DISPARITY", x:ML+126, w:24},
    {label:"VERDICT", x:ML+152, w:26}
  ];
  setF(6.5, "bold", C.white);
  tcols.forEach(c => txt(c.label, c.x, y+5.5));
  y += 8;

  biasResults.groupResults.forEach((g,i) => {
    check(9);
    fillR(ML, y, CW, 9, i%2===0?C.white:C.lightGray);
    strokeR(ML, y, CW, 9, C.border, 0.15);

    const rC = g.riskLevel==="high"?C.red:g.riskLevel==="medium"?C.orange:C.green;
    const rL = g.riskLevel==="high"?C.lightRed:g.riskLevel==="medium"?C.lightOrange:C.lightGreen;
    const rT = g.riskLevel==="high"?"HIGH BIAS":g.riskLevel==="medium"?"MEDIUM":"FAIR";

    setF(7.5, "bold", C.text); txt(g.group, ML+3, y+6);
    setF(7, "normal", C.muted); txt(g.column, ML+40, y+6);
    setF(7, "normal", C.text); txt(String(g.count), ML+68, y+6);

    drawHorizBar(ML+92, y+2.5, 28, g.approvalRate, 100, rC, C.border);
    setF(7, "bold", rC); txt(g.approvalRate+"%", ML+122, y+6);

    setF(7, "normal", C.text); txt(g.disparity+"%", ML+126, y+6);

    fillR(ML+150, y+1.5, 27, 6, rL, 2);
    setF(6, "bold", rC); txt(rT, ML+163, y+5.8, {align:"center"});
    y += 9;
  });

  y += 8;

  if(biasResults.intersectionalFlags?.length > 0) {
    check(20);
    fillR(ML, y, CW, 8, [127,29,29]);
    fillR(ML, y, 4, 8, C.red);
    setF(7.5, "bold", C.white);
    txt("INTERSECTIONAL BIAS DETECTED", ML+7, y+5.5);
    y += 12;

    biasResults.intersectionalFlags.slice(0,3).forEach(f => {
      check(16);
      fillR(ML, y, CW, 14, C.lightRed, 3);
      strokeR(ML, y, CW, 14, [254,202,202], 0.3, 3);
      fillR(ML, y, 3, 14, C.red);
      setF(8, "bold", C.red); txt(f.groups, ML+7, y+6);
      setF(7, "normal", C.gray);
      txt("Approval "+f.approvalRate+"% vs baseline "+f.baseRate+"% — "+f.disparity+"% disparity", ML+7, y+11);
      y += 18;
    });
  }

  // ═══════════════════════════════════════════
  // PAGE 4 — RECOMMENDATIONS
  // ═══════════════════════════════════════════
  addPage();

  setF(14, "bold", C.text);
  txt("Recommendations", ML, y);
  setF(8, "normal", C.muted);
  txt("AI-generated actionable fixes ranked by estimated impact on fairness score", ML, y+6);
  doc.setDrawColor(...C.blue);
  doc.setLineWidth(0.5);
  doc.line(ML, y+9, ML+CW, y+9);
  y += 16;

  const recs = geminiResults?.recommendations || [];
  recs.forEach((r,i) => {
    check(36);
    const dC = r.difficulty==="Easy"?C.green:r.difficulty==="Medium"?C.orange:C.red;
    const dL = r.difficulty==="Easy"?C.lightGreen:r.difficulty==="Medium"?C.lightOrange:C.lightRed;

    fillR(ML, y, CW, 32, C.lightGray, 3);
    strokeR(ML, y, CW, 32, C.border, 0.3, 3);
    fillR(ML, y, 5, 32, C.blue);

    fillR(ML+9, y+4, 10, 10, C.blue, 5);
    setF(8, "bold", C.white);
    txt("0"+(i+1), ML+14, y+11, {align:"center"});

    setF(9, "bold", C.text);
    txt(r.title, ML+23, y+10);

    fillR(PW-MR-40, y+3, 18, 6, dL, 2);
    setF(6, "bold", dC); txt(r.difficulty, PW-MR-31, y+7.5, {align:"center"});

    fillR(PW-MR-20, y+3, 16, 6, C.lightGreen, 2);
    setF(6, "bold", C.green); txt("+"+r.estimatedImprovement+"%", PW-MR-12, y+7.5, {align:"center"});

    const impactBarW = 60;
    const impactVal = (r.estimatedImprovement/20)*impactBarW;
    fillR(ML+23, y+14, impactBarW, 3, C.border, 2);
    fillR(ML+23, y+14, Math.min(impactVal,impactBarW), 3, C.green, 2);
    setF(6, "normal", C.muted); txt("Impact", ML+86, y+17);

    setF(7, "normal", C.gray);
    const expLines = doc.splitTextToSize(r.explanation, CW-28);
    expLines.slice(0,2).forEach((l,li) => txt(l, ML+23, y+22+li*4));
    y += 36;
  });

  y += 4;
  check(50);

  fillR(ML, y, CW, 8, [127,29,29]);
  fillR(ML, y, 4, 8, C.red);
  setF(7.5, "bold", C.white);
  txt("REGULATORY RISK ASSESSMENT", ML+7, y+5.5);

  fillR(PW-MR-55, y+1, 26, 6, C.lightRed, 2);
  setF(5.5, "bold", C.red); txt("EU AI Act 2024", PW-MR-42, y+5.5, {align:"center"});
  fillR(PW-MR-27, y+1, 23, 6, C.lightRed, 2);
  setF(5.5, "bold", C.red); txt("India DPDP 2023", PW-MR-15, y+5.5, {align:"center"});
  y += 12;

  fillR(ML, y, CW, 38, C.lightRed, 3);
  strokeR(ML, y, CW, 38, [254,202,202], 0.4, 3);
  fillR(ML, y, 4, 38, C.red);

  setF(7.5, "normal", C.text);
  const regText = geminiResults?.regulatoryRisk || "This bias level may violate EU AI Act 2024 Article 10 and India DPDP Act 2023 Section 4.";
  const regLines = doc.splitTextToSize(regText, CW-14);
  regLines.slice(0,5).forEach((l,i) => txt(l, ML+8, y+8+i*4.5));
  y += 46;

  check(20);
  fillR(ML, y, CW, 18, C.lightGray, 3);
  strokeR(ML, y, CW, 18, C.border, 0.2, 3);
  setF(6.5, "bold", C.muted); txt("DISCLAIMER", ML+5, y+6);
  setF(6, "normal", C.muted);
  const disc = "This report is for internal compliance review only. All CSV data is processed locally in the browser — no data is transmitted to any server. This does not constitute legal advice. Consult qualified experts before making compliance decisions.";
  const dLines = doc.splitTextToSize(disc, CW-12);
  dLines.forEach((l,i) => txt(l, ML+5, y+11+i*3.5));

  const safe = fileName.replace(".csv","").replace(/[^a-z0-9]/gi,"-");
  doc.save("FairSight-Audit-"+safe+"-"+auditId+".pdf");
}