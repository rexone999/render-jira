import { NextResponse } from "next/server"

export async function GET() {
  // Server-side environment check
  const hasGeminiKey = !!process.env.GEMINI_API_KEY
  const hasJiraConfig = !!(process.env.JIRA_BASE_URL && process.env.JIRA_EMAIL && process.env.JIRA_API_TOKEN)

  const healthData = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: "1.0.0",
    services: {
      gemini: hasGeminiKey,
      jira: hasJiraConfig,
    },
    endpoints: {
      descriptor: "/atlassian-connect.json",
      main: "/jira-app",
      panel: "/jira-app/project",
      stories: "/api/generate-stories",
      publish: "/api/publish-to-jira",
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      platform: process.platform,
    },
  }

  return NextResponse.json(healthData, {
    status: 200,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Content-Type": "application/json",
    },
  })
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}
