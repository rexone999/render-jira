// ✅ Use in-memory connect.json - Fastest response
import { NextResponse } from "next/server"

const CONNECT_DESCRIPTOR = {
  name: "PO Assist - AI Story Generator",
  description: "AI-powered tool to generate EPICs and User Stories from Business Requirements Documents",
  key: "po-assist-optimized-v5",
  baseUrl: "https://v0-jira-epic-generator.vercel.app",
  vendor: {
    name: "PO Assist Team",
    url: "https://v0-jira-epic-generator.vercel.app",
  },
  authentication: {
    type: "none",
  },
  lifecycle: {
    installed: "/api/atlassian/installed",
    uninstalled: "/api/atlassian/uninstalled",
  },
  apiVersion: 1,
  modules: {
    generalPages: [
      {
        key: "po-assist-main",
        location: "system.top.navigation.bar",
        name: {
          value: "PO Assist",
        },
        url: "/jira-embed",
        conditions: [
          {
            condition: "user_is_logged_in",
          },
        ],
      },
    ],
    webPanels: [
      {
        key: "po-assist-sidebar",
        location: "atl.jira.view.project.sidebar.left",
        name: {
          value: "AI Stories",
        },
        url: "/jira-embed/panel?project={project.key}",
        conditions: [
          {
            condition: "user_is_logged_in",
          },
        ],
      },
    ],
  },
  scopes: ["READ"],
  contexts: ["account"],
}

export async function GET() {
  return NextResponse.json(CONNECT_DESCRIPTOR, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=300, s-maxage=300",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
