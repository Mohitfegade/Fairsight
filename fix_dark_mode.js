const fs = require('fs');

function fixUploadScreen() {
    let content = fs.readFileSync('src/components/UploadScreen.js', 'utf-8');
    
    content = content.replace(
        'export default function UploadScreen({ onAnalyze }) {',
        'export default function UploadScreen({ onAnalyze, darkMode, theme }) {'
    );

    content = content.replace(/background: "#F9FAFB"/g, 'background: theme.bg');
    content = content.replace(/background: "white"/g, 'background: theme.card');
    content = content.replace(/border: "1px solid #E5E7EB"/g, 'border: "1px solid " + theme.border');
    content = content.replace(/color: "#111"/g, 'color: theme.text');
    content = content.replace(/color: "#6B7280"/g, 'color: theme.muted');
    
    // update outermost div
    content = content.replace(
        '<div style={{ maxWidth: 700, margin: "0 auto", padding: "2rem 1rem" }}>',
        '<div style={{ minHeight: "100vh", background: theme.bg, maxWidth: 700, margin: "0 auto", padding: "2rem 1rem" }}>'
    );
    
    fs.writeFileSync('src/components/UploadScreen.js', content, 'utf-8');
}

function fixLandingPage() {
    let content = fs.readFileSync('src/components/LandingPage.js', 'utf-8');
    
    content = content.replace(
        'export default function LandingPage({ onGetStarted }) {',
        'export default function LandingPage({ onGetStarted, darkMode, theme }) {'
    );

    content = content.replace(
        '<div style={{ fontFamily: "sans-serif", background: "#fff" }}>',
        '<div style={{ minHeight: "100vh", background: theme.bg, fontFamily: "sans-serif" }}>'
    );
    
    fs.writeFileSync('src/components/LandingPage.js', content, 'utf-8');
}

function fixApp() {
    let content = fs.readFileSync('src/App.js', 'utf-8');
    
    const insertion = `  const [darkMode, setDarkMode] = useState(false);

  const theme = {
    bg: darkMode ? "#0F172A" : "#F9FAFB",
    card: darkMode ? "#1E293B" : "#FFFFFF",
    border: darkMode ? "#334155" : "#E5E7EB",
    text: darkMode ? "#F1F5F9" : "#111111",
    muted: darkMode ? "#94A3B8" : "#6B7280",
    navBg: darkMode ? "#0F172A" : "#FFFFFF",
  };
`;
    content = content.replace('const [screen, setScreen] = useState("landing");', insertion + '\n  const [screen, setScreen] = useState("landing");');

    content = content.replace(/background: "#F9FAFB"/g, 'background: theme.bg');
    content = content.replace(/background: "white"/g, 'background: theme.card');
    content = content.replace(/border: "1px solid #E5E7EB"/g, 'border: "1px solid " + theme.border');
    content = content.replace(/color: "#111"/g, 'color: theme.text');
    content = content.replace(/color: "#6B7280"/g, 'color: theme.muted');

    content = content.replace('<UploadScreen onAnalyze={handleAnalyze} />', '<UploadScreen onAnalyze={handleAnalyze} darkMode={darkMode} theme={theme} />');
    content = content.replace('<LandingPage onGetStarted={() => setScreen("upload")} />', '<LandingPage onGetStarted={() => setScreen("upload")} darkMode={darkMode} theme={theme} />');

    const toggleButton = `
        <button
          onClick={() => setDarkMode(!darkMode)}
          style={{
            position: "fixed", top: 16, right: 16, zIndex: 1000,
            width: 44, height: 44, borderRadius: "50%",
            border: "1px solid " + theme.border,
            background: theme.card, cursor: "pointer",
            fontSize: 20, display: "flex", alignItems: "center",
            justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
          }}
        >
          {darkMode ? "☀️" : "🌙"}
        </button>`;

    content = content.replace(
        '    return <LandingPage onGetStarted={() => setScreen("upload")} darkMode={darkMode} theme={theme} />;',
        `    return (
      <div style={{ minHeight: "100vh", background: theme.bg }}>
\${toggleButton}
        <LandingPage onGetStarted={() => setScreen("upload")} darkMode={darkMode} theme={theme} />
      </div>
    );`
    );

    content = content.replace(
        `      <div style={{ minHeight: "100vh", background: theme.bg, display: "flex",\n        flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>`,
        `      <div style={{ minHeight: "100vh", background: theme.bg, display: "flex",\n        flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>\${toggleButton}`
    );

    content = content.replace(
        `    return (\n      <div style={{ maxWidth: 700, margin: "0 auto", padding: "2rem 1rem" }}>`,
        `    return (\n      <div style={{ minHeight: "100vh", background: theme.bg }}>\${toggleButton}\n        <div style={{ maxWidth: 700, margin: "0 auto", padding: "2rem 1rem" }}>`
    );

    content = content.replace(
        `      </div>\n    );\n  }\n\n  return (`,
        `        </div>\n      </div>\n    );\n  }\n\n  return (`
    );

    content = content.replace(
        `    <div style={{ minHeight: "100vh", background: theme.bg }}>\n      <UploadScreen`,
        `    <div style={{ minHeight: "100vh", background: theme.bg }}>\${toggleButton}\n      <UploadScreen`
    );

    fs.writeFileSync('src/App.js', content, 'utf-8');
}

fixUploadScreen();
fixLandingPage();
fixApp();
console.log('Script completed.');
