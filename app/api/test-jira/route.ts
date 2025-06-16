import { NextResponse } from "next/server"

const JIRA_BASE_URL = process.env.JIRA_BASE_URL
const JIRA_EMAIL = process.env.JIRA_EMAIL
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN

export async function GET() {
  try {
    console.log("Testing Jira connection...")
    console.log("JIRA_BASE_URL:", JIRA_BASE_URL)
    console.log("JIRA_EMAIL:", JIRA_EMAIL)
    console.log("JIRA_API_TOKEN:", JIRA_API_TOKEN ? "Present" : "Missing")

    if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) {
      return NextResponse.json({
        success: false,
        error: "Missing Jira configuration",
        details: {
          baseUrl: !!JIRA_BASE_URL,
          email: !!JIRA_EMAIL,
          token: !!JIRA_API_TOKEN,
        },
      })
    }

    const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64")

    // Test basic authentication
    const response = await fetch(`${JIRA_BASE_URL}/rest/api/3/myself`, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({
        success: false,
        error: "Authentication failed",
        status: response.status,
        details: errorText,
      })
    }

    const userData = await response.json()

    // Test projects access
    const projectsResponse = await fetch(`${JIRA_BASE_URL}/rest/api/3/project`, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
    })

    let projects = []
    if (projectsResponse.ok) {
      projects = await projectsResponse.json()
    }

    // Get project-specific issue types for the first project
    let projectIssueTypes = []
    if (projects.length > 0) {
      const projectKey = projects[0].key
      const projectDetailsResponse = await fetch(`${JIRA_BASE_URL}/rest/api/3/project/${projectKey}`, {
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: "application/json",
        },
      })

      if (projectDetailsResponse.ok) {
        const projectData = await projectDetailsResponse.json()
        projectIssueTypes = projectData.issueTypes || []
      }
    }

    // Test global issue types as fallback
    const issueTypesResponse = await fetch(`${JIRA_BASE_URL}/rest/api/3/issuetype`, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
    })

    let globalIssueTypes = []
    if (issueTypesResponse.ok) {
      globalIssueTypes = await issueTypesResponse.json()
    }

    // Test priorities
    const prioritiesResponse = await fetch(`${JIRA_BASE_URL}/rest/api/3/priority`, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
    })

    let priorities = []
    if (prioritiesResponse.ok) {
      priorities = await prioritiesResponse.json()
    }

    // Filter issue types
    const regularProjectIssueTypes = projectIssueTypes.filter((type: any) => !type.subtask)
    const regularGlobalIssueTypes = globalIssueTypes.filter((type: any) => !type.subtask)
    const subtaskIssueTypes = globalIssueTypes.filter((type: any) => type.subtask)

    return NextResponse.json({
      success: true,
      user: {
        displayName: userData.displayName,
        emailAddress: userData.emailAddress,
        accountId: userData.accountId,
      },
      projects: projects.map((p: any) => ({
        key: p.key,
        name: p.name,
        id: p.id,
      })),
      issueTypes: {
        projectSpecific: regularProjectIssueTypes.map((it: any) => ({
          id: it.id,
          name: it.name,
          description: it.description,
          subtask: it.subtask,
        })),
        globalRegular: regularGlobalIssueTypes.map((it: any) => ({
          id: it.id,
          name: it.name,
          description: it.description,
          subtask: it.subtask,
        })),
        subtasks: subtaskIssueTypes.map((it: any) => ({
          id: it.id,
          name: it.name,
          description: it.description,
          subtask: it.subtask,
        })),
      },
      priorities: priorities.map((p: any) => ({
        id: p.id,
        name: p.name,
      })),
    })
  } catch (error) {
    console.error("Jira test error:", error)
    return NextResponse.json({
      success: false,
      error: "Connection failed",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
