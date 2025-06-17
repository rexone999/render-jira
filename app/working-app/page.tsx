"use client"

import { useState, useEffect } from "react"

export default function WorkingAppPage() {
  const [brdContent, setBrdContent] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedStories, setGeneratedStories] = useState<any[]>([])
  const [message, setMessage] = useState("")

  useEffect(() => {
    // Simple iframe resizing
    const resizeIframe = () => {
      if (window.parent !== window) {
        const height = Math.max(document.documentElement.scrollHeight, 500)
        try {
          window.parent.postMessage({ type: "resize", height }, "*")
        } catch (e) {
          console.log("Resize message sent")
        }
      }
    }

    setTimeout(resizeIframe, 100)
    const observer = new MutationObserver(resizeIframe)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [generatedStories])

  const generateStories = async () => {
    if (!brdContent.trim()) {
      setMessage("Please enter BRD content")
      return
    }

    setIsGenerating(true)
    setMessage("Generating stories...")

    try {
      const response = await fetch("/api/generate-stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brdContent,
          projectName: "Generated Project",
        }),
      })

      if (!response.ok) throw new Error("Failed to generate")

      const data = await response.json()
      setGeneratedStories(data.stories)
      setMessage(`✅ Generated ${data.stories.length} stories successfully!`)
    } catch (error) {
      setMessage("❌ Failed to generate stories")
    } finally {
      setIsGenerating(false)
    }
  }

  const publishToJira = async () => {
    if (generatedStories.length === 0) return

    setMessage("Publishing to Jira...")

    try {
      const response = await fetch("/api/publish-to-jira", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stories: generatedStories,
          projectKey: "TEST",
        }),
      })

      if (!response.ok) throw new Error("Failed to publish")

      const data = await response.json()
      setMessage(`✅ Published ${data.publishedCount} stories to Jira!`)
    } catch (error) {
      setMessage("❌ Failed to publish to Jira")
    }
  }

  return (
    <div style={{ padding: "20px", fontFamily: "system-ui, sans-serif", backgroundColor: "white" }}>
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          padding: "15px",
          borderRadius: "8px",
          marginBottom: "20px",
          textAlign: "center",
        }}
      >
        <h1 style={{ margin: "0 0 5px 0", fontSize: "24px" }}>🚀 PO Assist</h1>
        <p style={{ margin: 0, fontSize: "14px", opacity: 0.9 }}>AI Story Generator for Jira</p>
      </div>

      {/* Status Message */}
      {message && (
        <div
          style={{
            padding: "10px",
            marginBottom: "15px",
            backgroundColor: message.includes("❌") ? "#fee" : "#efe",
            border: `1px solid ${message.includes("❌") ? "#fcc" : "#cfc"}`,
            borderRadius: "4px",
            fontSize: "14px",
          }}
        >
          {message}
        </div>
      )}

      {/* BRD Input */}
      <div style={{ marginBottom: "15px" }}>
        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "14px" }}>
          Business Requirements Document:
        </label>
        <textarea
          value={brdContent}
          onChange={(e) => setBrdContent(e.target.value)}
          placeholder="Paste your BRD content here to generate EPICs and user stories..."
          style={{
            width: "100%",
            height: "120px",
            padding: "10px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            fontSize: "14px",
            fontFamily: "system-ui, sans-serif",
            resize: "vertical",
          }}
        />
      </div>

      {/* Generate Button */}
      <button
        onClick={generateStories}
        disabled={isGenerating || !brdContent.trim()}
        style={{
          backgroundColor: isGenerating ? "#ccc" : "#667eea",
          color: "white",
          border: "none",
          padding: "12px 24px",
          borderRadius: "4px",
          cursor: isGenerating ? "not-allowed" : "pointer",
          fontSize: "14px",
          fontWeight: "bold",
          marginRight: "10px",
        }}
      >
        {isGenerating ? "⏳ Generating..." : "✨ Generate Stories"}
      </button>

      {/* Publish Button */}
      {generatedStories.length > 0 && (
        <button
          onClick={publishToJira}
          style={{
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            padding: "12px 24px",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "bold",
          }}
        >
          📤 Publish to Jira
        </button>
      )}

      {/* Generated Stories */}
      {generatedStories.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h3 style={{ color: "#333", marginBottom: "10px" }}>Generated Stories ({generatedStories.length}):</h3>
          <div style={{ maxHeight: "300px", overflowY: "auto" }}>
            {generatedStories.map((story, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: "#f8f9fa",
                  border: "1px solid #e9ecef",
                  borderRadius: "4px",
                  padding: "10px",
                  marginBottom: "8px",
                }}
              >
                <div style={{ marginBottom: "5px" }}>
                  <span
                    style={{
                      backgroundColor: story.type === "epic" ? "#007bff" : "#6c757d",
                      color: "white",
                      padding: "2px 6px",
                      borderRadius: "3px",
                      fontSize: "11px",
                      fontWeight: "bold",
                      marginRight: "5px",
                    }}
                  >
                    {story.type.toUpperCase()}
                  </span>
                  <span
                    style={{
                      backgroundColor: "#e9ecef",
                      color: "#495057",
                      padding: "2px 6px",
                      borderRadius: "3px",
                      fontSize: "11px",
                    }}
                  >
                    {story.priority}
                  </span>
                </div>
                <h4 style={{ margin: "5px 0", fontSize: "14px", fontWeight: "bold" }}>{story.title}</h4>
                <p style={{ margin: "5px 0 0 0", fontSize: "12px", color: "#666", lineHeight: "1.4" }}>
                  {story.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
