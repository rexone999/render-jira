"use client"

import { useState, useEffect } from "react"

export default function UltraSimplePage() {
  const [brdContent, setBrdContent] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedStories, setGeneratedStories] = useState<any[]>([])
  const [message, setMessage] = useState("✅ PO Assist loaded successfully!")
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Immediate load to prevent timeout
    setIsLoaded(true)

    // Simple iframe communication
    const sendHeight = () => {
      if (window.parent !== window) {
        try {
          const height = Math.max(document.documentElement.scrollHeight, 400)
          window.parent.postMessage({ height }, "*")
        } catch (e) {
          // Ignore cross-origin errors
        }
      }
    }

    // Send height immediately and on changes
    setTimeout(sendHeight, 50)
    const observer = new MutationObserver(sendHeight)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [generatedStories])

  const generateStories = async () => {
    if (!brdContent.trim()) {
      setMessage("❌ Please enter BRD content")
      return
    }

    setIsGenerating(true)
    setMessage("⏳ Generating stories...")

    try {
      const response = await fetch("/api/generate-stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brdContent,
          projectName: "AI Generated Project",
        }),
      })

      if (!response.ok) throw new Error("Generation failed")

      const data = await response.json()
      setGeneratedStories(data.stories)
      setMessage(`✅ Generated ${data.stories.length} stories successfully!`)
    } catch (error) {
      setMessage("❌ Failed to generate stories. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const publishToJira = async () => {
    if (generatedStories.length === 0) return

    setMessage("⏳ Publishing to Jira...")

    try {
      const response = await fetch("/api/publish-to-jira", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stories: generatedStories,
          projectKey: "TEST", // You can change this
        }),
      })

      if (!response.ok) throw new Error("Publishing failed")

      const data = await response.json()
      setMessage(`✅ Published ${data.publishedCount} stories to Jira!`)
    } catch (error) {
      setMessage("❌ Failed to publish to Jira. Check your Jira connection.")
    }
  }

  // Show loading state briefly to prevent timeout
  if (!isLoaded) {
    return (
      <div style={{ padding: "20px", textAlign: "center", fontFamily: "Arial, sans-serif" }}>
        <div>Loading PO Assist...</div>
      </div>
    )
  }

  return (
    <div
      style={{
        padding: "15px",
        fontFamily: "Arial, sans-serif",
        backgroundColor: "white",
        minHeight: "400px",
      }}
    >
      {/* Simple Header */}
      <div
        style={{
          background: "#0052cc",
          color: "white",
          padding: "10px 15px",
          borderRadius: "5px",
          marginBottom: "15px",
          textAlign: "center",
        }}
      >
        <h1 style={{ margin: "0 0 5px 0", fontSize: "20px" }}>🚀 PO Assist</h1>
        <p style={{ margin: 0, fontSize: "12px", opacity: 0.9 }}>AI Story Generator</p>
      </div>

      {/* Status Message */}
      <div
        style={{
          padding: "8px 12px",
          marginBottom: "15px",
          backgroundColor: message.includes("❌") ? "#ffebee" : "#e8f5e8",
          border: `1px solid ${message.includes("❌") ? "#ffcdd2" : "#c8e6c8"}`,
          borderRadius: "4px",
          fontSize: "13px",
          color: message.includes("❌") ? "#c62828" : "#2e7d32",
        }}
      >
        {message}
      </div>

      {/* BRD Input */}
      <div style={{ marginBottom: "15px" }}>
        <label
          style={{
            display: "block",
            marginBottom: "5px",
            fontWeight: "bold",
            fontSize: "13px",
            color: "#333",
          }}
        >
          📋 Business Requirements Document:
        </label>
        <textarea
          value={brdContent}
          onChange={(e) => setBrdContent(e.target.value)}
          placeholder="Paste your BRD content here to generate EPICs and user stories..."
          style={{
            width: "100%",
            height: "100px",
            padding: "8px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            fontSize: "13px",
            fontFamily: "Arial, sans-serif",
            resize: "vertical",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Action Buttons */}
      <div style={{ marginBottom: "15px" }}>
        <button
          onClick={generateStories}
          disabled={isGenerating || !brdContent.trim()}
          style={{
            backgroundColor: isGenerating ? "#ccc" : "#0052cc",
            color: "white",
            border: "none",
            padding: "10px 20px",
            borderRadius: "4px",
            cursor: isGenerating ? "not-allowed" : "pointer",
            fontSize: "13px",
            fontWeight: "bold",
            marginRight: "10px",
          }}
        >
          {isGenerating ? "⏳ Generating..." : "✨ Generate Stories"}
        </button>

        {generatedStories.length > 0 && (
          <button
            onClick={publishToJira}
            style={{
              backgroundColor: "#00875a",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "bold",
            }}
          >
            📤 Publish to Jira
          </button>
        )}
      </div>

      {/* Generated Stories */}
      {generatedStories.length > 0 && (
        <div>
          <h3
            style={{
              color: "#333",
              marginBottom: "10px",
              fontSize: "16px",
              borderBottom: "2px solid #0052cc",
              paddingBottom: "5px",
            }}
          >
            📝 Generated Stories ({generatedStories.length}):
          </h3>
          <div style={{ maxHeight: "250px", overflowY: "auto" }}>
            {generatedStories.slice(0, 10).map((story, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: "#f8f9fa",
                  border: "1px solid #e1e5e9",
                  borderRadius: "4px",
                  padding: "8px",
                  marginBottom: "6px",
                  fontSize: "12px",
                }}
              >
                <div style={{ marginBottom: "4px" }}>
                  <span
                    style={{
                      backgroundColor: story.type === "epic" ? "#0052cc" : "#6b778c",
                      color: "white",
                      padding: "2px 6px",
                      borderRadius: "3px",
                      fontSize: "10px",
                      fontWeight: "bold",
                      marginRight: "5px",
                    }}
                  >
                    {story.type.toUpperCase()}
                  </span>
                  <span
                    style={{
                      backgroundColor: "#dfe1e6",
                      color: "#42526e",
                      padding: "2px 6px",
                      borderRadius: "3px",
                      fontSize: "10px",
                    }}
                  >
                    {story.priority}
                  </span>
                </div>
                <div style={{ fontWeight: "bold", marginBottom: "3px" }}>{story.title}</div>
                <div style={{ color: "#6b778c", lineHeight: "1.3" }}>{story.description?.substring(0, 100)}...</div>
              </div>
            ))}
            {generatedStories.length > 10 && (
              <div style={{ textAlign: "center", color: "#6b778c", fontSize: "11px" }}>
                ... and {generatedStories.length - 10} more stories
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
