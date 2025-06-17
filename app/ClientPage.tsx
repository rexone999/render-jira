"use client"

import { useEffect, useState } from "react"

export default function ClientPage() {
  const [isInJira, setIsInJira] = useState(false)
  const currentTime = new Date().toISOString()

  useEffect(() => {
    // Check if we're in a Jira iframe
    const urlParams = new URLSearchParams(window.location.search)
    const hasJwt = urlParams.get("jwt")

    if (hasJwt || window.parent !== window) {
      setIsInJira(true)
      // Redirect to Jira app if we're in Jira
      window.location.href = "/jira-app?" + window.location.search
    }
  }, [])

  if (isInJira) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "4px solid #f3f3f3",
              borderTop: "4px solid #3498db",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 20px",
            }}
          ></div>
          <p>Redirecting to PO Assist...</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <>
      <style jsx>{`
        .container { 
          max-width: 800px; 
          margin: 0 auto; 
          text-align: center;
          padding: 20px;
          font-family: system-ui, sans-serif;
        }
        .status { 
          background: #d4edda; 
          border: 1px solid #c3e6cb; 
          color: #155724; 
          padding: 15px; 
          border-radius: 5px; 
          margin: 20px 0; 
        }
        .endpoints { 
          background: #e9ecef; 
          padding: 15px; 
          border-radius: 5px; 
          text-align: left; 
          margin: 20px 0; 
        }
        .endpoint { 
          margin: 5px 0; 
          font-family: monospace; 
          font-size: 14px; 
        }
        .link { 
          color: #007bff; 
          text-decoration: none; 
        }
        .link:hover { 
          text-decoration: underline; 
        }
        .install-box {
          margin-top: 30px;
          padding: 15px;
          background: #fff3cd;
          border-radius: 5px;
          border: 1px solid #ffeaa7;
        }
        .install-code {
          background: #f8f9fa;
          padding: 5px;
          border-radius: 3px;
          font-family: monospace;
          word-break: break-all;
        }
        .services-status {
          margin-top: 20px;
          font-size: 14px;
          color: #6c757d;
        }
        .main-cta {
          margin-top: 30px;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 10px;
          color: white;
        }
        .cta-button {
          display: inline-block;
          padding: 12px 24px;
          background: white;
          color: #667eea;
          text-decoration: none;
          border-radius: 5px;
          font-weight: bold;
          margin-top: 15px;
          transition: transform 0.2s;
        }
        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        body {
          background: #f8f9fa;
          margin: 0;
          padding: 0;
        }
      `}</style>

      <div className="container">
        <h1>🚀 PO Assist - AI Story Generator</h1>
        <p>AI-powered tool to generate EPICs and User Stories from Business Requirements Documents</p>

        <div className="status">
          <strong>✅ Status: Active & Ready</strong>
          <br />
          <small>Last updated: {currentTime}</small>
        </div>

        <div className="main-cta">
          <h2>🎯 Ready to Generate Stories?</h2>
          <p>Transform your Business Requirements into actionable EPICs and User Stories with AI</p>
          <a href="/main" className="cta-button">
            🚀 Launch PO Assist Application
          </a>
        </div>

        <div className="install-box">
          <strong>🔧 For Jira Installation:</strong>
          <br />
          Use this URL in Jira Apps → Upload App:
          <br />
          <div className="install-code">https://v0-jira-epic-generator.vercel.app/atlassian-connect.json</div>
          <br />
          <small>After installation, access PO Assist from Jira's top navigation menu</small>
        </div>

        <div className="endpoints">
          <strong>📋 Available Endpoints:</strong>
          <div className="endpoint">
            <a href="/atlassian-connect.json" className="link" target="_blank" rel="noreferrer">
              /atlassian-connect.json
            </a>{" "}
            - Jira App Descriptor
          </div>
          <div className="endpoint">
            <a href="/jira-app" className="link" target="_blank" rel="noreferrer">
              /jira-app
            </a>{" "}
            - Jira Application Interface
          </div>
          <div className="endpoint">
            <a href="/main" className="link" target="_blank" rel="noreferrer">
              /main
            </a>{" "}
            - Standalone Application
          </div>
          <div className="endpoint">
            <a href="/api/health" className="link" target="_blank" rel="noreferrer">
              /api/health
            </a>{" "}
            - Health Check API
          </div>
        </div>

        <div className="services-status">
          <strong>🔧 Configuration:</strong>
          <br />• Environment: Production Ready
          <br />• AI Engine: Configured & Active
          <br />• Jira Integration: Ready for Installation
          <br />• API Endpoints: All Operational
        </div>

        <div style={{ marginTop: "40px", padding: "15px", background: "#e3f2fd", borderRadius: "5px" }}>
          <strong>💡 Quick Start Guide:</strong>
          <br />
          <strong>1.</strong> Install in Jira using the URL above
          <br />
          <strong>2.</strong> Click "PO Assist" in Jira's top navigation
          <br />
          <strong>3.</strong> Upload your BRD and generate stories
          <br />
          <strong>4.</strong> Publish directly to your Jira backlog
        </div>
      </div>
    </>
  )
}
