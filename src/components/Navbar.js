import React from "react";

export default function Navbar({ user, onSignIn, onSignOut, onHistory, onCompare, theme }) {
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 999,
      background: theme.navBg, borderBottom: "1px solid " + theme.border,
      padding: "0 24px", height: 56,
      display: "flex", alignItems: "center", justifyContent: "space-between"
    }}>
      <span style={{ fontSize: 20, fontWeight: 700, color: theme.text }}>
        Fair<span style={{ color: theme.accent }}>Sight</span>
      </span>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {user ? (
          <>
            <button onClick={() => onCompare && onCompare()}
              style={{ padding: "7px 16px", borderRadius: 8, fontSize: 13,
                fontWeight: 500, cursor: "pointer",
                border: "1px solid " + theme.border,
                background: "transparent", color: theme.text }}>
              Compare
            </button>
            <button onClick={onHistory}
              style={{ padding: "7px 16px", borderRadius: 8, fontSize: 13,
                fontWeight: 500, cursor: "pointer",
                border: "1px solid " + theme.border,
                background: "transparent", color: theme.text }}>
              Audit History
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <img src={user.photoURL} alt="" 
                style={{ width: 32, height: 32, borderRadius: "50%" }} />
              <span style={{ fontSize: 13, color: theme.muted }}>
                {user.displayName?.split(" ")[0]}
              </span>
            </div>
            <button onClick={onSignOut}
              style={{ padding: "7px 16px", borderRadius: 8, fontSize: 13,
                cursor: "pointer", border: "1px solid " + theme.border,
                background: "transparent", color: theme.muted }}>
              Sign out
            </button>
          </>
        ) : (
          <button onClick={onSignIn}
            style={{ padding: "7px 20px", borderRadius: 8, fontSize: 13,
              fontWeight: 600, cursor: "pointer", border: "none",
              background: theme.accent, color: "white" }}>
            Sign in with Google
          </button>
        )}
      </div>
    </div>
  );
}
