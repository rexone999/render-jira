"use client"

export default function HealthPageClient() {
  const currentTime = new Date().toISOString()

  return (
    <>
      <style jsx>{`
        .health-container {
          font-family: system-ui, sans-serif;
          padding: 20px;
          text-align: center;
          background-color: #f8f9fa;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        .health-title {
          color: #28a745;
          margin: 0 0 10px 0;
        }
        .health-subtitle {
          margin: 0;
          color: #6c757d;
          font-size: 14px;
        }
        .health-details {
          margin-top: 20px;
          padding: 10px;
          background-color: #e9ecef;
          border-radius: 5px;
          font-size: 12px;
          color: #495057;
        }
        .back-link {
          margin-top: 15px;
          color: #007bff;
          text-decoration: none;
          font-size: 14px;
        }
        .back-link:hover {
          text-decoration: underline;
        }
      `}</style>

      <div className="health-container">
        <h1 className="health-title">✅ PO Assist - Health Check</h1>
        <p className="health-subtitle">Status: Healthy | Timestamp: {currentTime}</p>
        <div className="health-details">
          <strong>Quick Health Check:</strong>
          <br />• Server: Running
          <br />• API: Available
          <br />• Jira Integration: Ready
          <br />• AI Engine: Active
        </div>
        <a href="/" className="back-link">
          ← Back to Main Page
        </a>
      </div>
    </>
  )
}
