// Alternative simple page without styled-jsx for compatibility
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "PO Assist - Simple Interface",
  description: "Simple interface for PO Assist AI Story Generator",
}

export default function SimplePage() {
  const currentTime = new Date().toISOString()

  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        textAlign: "center",
        padding: "20px",
        fontFamily: "system-ui, sans-serif",
        backgroundColor: "#f8f9fa",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ color: "#333", marginBottom: "10px" }}>🚀 PO Assist - AI Story Generator</h1>
      <p style={{ color: "#666", marginBottom: "30px" }}>
        AI-powered tool to generate EPICs and User Stories from Business Requirements Documents
      </p>

      <div
        style={{
          background: "#d4edda",
          border: "1px solid #c3e6cb",
          color: "#155724",
          padding: "15px",
          borderRadius: "5px",
          margin: "20px 0",
        }}
      >
        <strong>✅ Status: Active</strong>
        <br />
        <small>Last updated: {currentTime}</small>
      </div>

      <div
        style={{
          background: "#e9ecef",
          padding: "15px",
          borderRadius: "5px",
          textAlign: "left",
          margin: "20px 0",
        }}
      >
        <strong>📋 Available Endpoints:</strong>
        <div style={{ margin: "10px 0", fontFamily: "monospace", fontSize: "14px" }}>
          <a href="/atlassian-connect.json" style={{ color: "#007bff" }} target="_blank" rel="noreferrer">
            /atlassian-connect.json
          </a>{" "}
          - Jira App Descriptor
        </div>
        <div style={{ margin: "10px 0", fontFamily: "monospace", fontSize: "14px" }}>
          <a href="/jira-embed" style={{ color: "#007bff" }} target="_blank" rel="noreferrer">
            /jira-embed
          </a>{" "}
          - Main Application Interface
        </div>
        <div style={{ margin: "10px 0", fontFamily: "monospace", fontSize: "14px" }}>
          <a href="/main" style={{ color: "#007bff" }} target="_blank" rel="noreferrer">
            /main
          </a>{" "}
          - Full React Application
        </div>
      </div>

      <div
        style={{
          marginTop: "30px",
          padding: "15px",
          background: "#fff3cd",
          borderRadius: "5px",
          border: "1px solid #ffeaa7",
        }}
      >
        <strong>🔧 For Jira Installation:</strong>
        <br />
        Use this URL in Jira Apps → Upload App:
        <br />
        <code
          style={{
            background: "#f8f9fa",
            padding: "5px",
            borderRadius: "3px",
            fontFamily: "monospace",
            wordBreak: "break-all",
          }}
        >
          https://v0-jira-epic-generator.vercel.app/atlassian-connect.json
        </code>
      </div>

      <div style={{ marginTop: "30px" }}>
        <a
          href="/main"
          style={{
            color: "#007bff",
            fontSize: "16px",
            fontWeight: "bold",
            textDecoration: "none",
          }}
        >
          🚀 Launch Full Application →
        </a>
      </div>
    </div>
  )
}
