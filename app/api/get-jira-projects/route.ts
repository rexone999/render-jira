import { NextResponse } from "next/server"

const JIRA_BASE_URL = process.env.JIRA_BASE_URL
const JIRA_EMAIL = process.env.JIRA_EMAIL
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN

export async function GET() {
  try {
    if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) {
      throw new Error("Jira configuration missing")
    }

    const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64")

    // Get all projects
    const projectsResponse = await fetch(`${JIRA_BASE_URL}/rest/api/3/project`, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
    })

    if (!projectsResponse.ok) {
      throw new Error("Failed to fetch projects")
    }

    const projects = await projectsResponse.json()

    // Get project templates for creating new projects
    const templatesResponse = await fetch(`${JIRA_BASE_URL}/rest/api/3/project/type`, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
    })

    let projectTypes = []
    if (templatesResponse.ok) {
      projectTypes = await templatesResponse.json()
    }

    return NextResponse.json({
      success: true,
      projects: projects.map((p: any) => ({
        key: p.key,
        name: p.name,
        id: p.id,
        projectTypeKey: p.projectTypeKey,
        lead: p.lead?.displayName,
      })),
      projectTypes: projectTypes.map((pt: any) => ({
        key: pt.key,
        formattedKey: pt.formattedKey,
        descriptionI18nKey: pt.descriptionI18nKey,
        icon: pt.icon,
      })),
    })
  } catch (error) {
    console.error("Error fetching Jira projects:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to fetch projects",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
