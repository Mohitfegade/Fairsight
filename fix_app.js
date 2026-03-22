const fs = require('fs');
let content = fs.readFileSync('src/App.js', 'utf-8');

const buttonCode = `        <button
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

content = content.replace(/\$\{toggleButton\}/g, buttonCode);
fs.writeFileSync('src/App.js', content, 'utf-8');
console.log('Fixed App.js');
