import { type NextRequest, NextResponse } from "next/server"

const JIRA_BASE_URL = process.env.JIRA_BASE_URL
const JIRA_EMAIL = process.env.JIRA_EMAIL
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN

export async function POST(request: NextRequest) {
  try {
    const { projectName, projectKey, projectType } = await request.json()

    console.log("Creating project with:", { projectName, projectKey, projectType })

    if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) {
      throw new Error("Jira configuration missing")
    }

    if (!projectName || !projectKey) {
      throw new Error("Project name and key are required")
    }

    const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64")

    // First, check if we have permission to create projects
    const permissionResponse = await fetch(`${JIRA_BASE_URL}/rest/api/3/permissions`, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
    })

    console.log("Permission check status:", permissionResponse.status)

    // Get current user to set as project lead
    const userResponse = await fetch(`${JIRA_BASE_URL}/rest/api/3/myself`, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
    })

    if (!userResponse.ok) {
      const errorText = await userResponse.text()
      console.error("Failed to get user info:", errorText)
      throw new Error("Failed to get user info")
    }

    const userData = await userResponse.json()
    console.log("User data:", userData.accountId, userData.displayName)

    // Check if project key already exists
    const existingProjectResponse = await fetch(`${JIRA_BASE_URL}/rest/api/3/project/${projectKey}`, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
    })

    if (existingProjectResponse.ok) {
      throw new Error(`Project with key "${projectKey}" already exists. Please choose a different key.`)
    }

    // Try simplified project creation first
    const projectData = {
      key: projectKey.toUpperCase(),
      name: projectName,
      projectTypeKey: "software", // Always use software for simplicity
      leadAccountId: userData.accountId,
      description: `Project created by PO Assist for managing user stories and EPICs`,
    }

    console.log("Creating project with data:", JSON.stringify(projectData, null, 2))

    const createResponse = await fetch(`${JIRA_BASE_URL}/rest/api/3/project`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(projectData),
    })

    console.log("Create response status:", createResponse.status)

    if (!createResponse.ok) {
      const errorText = await createResponse.text()
      console.error("Failed to create project:", errorText)

      // Try to parse error details
      let errorDetails = errorText
      try {
        const errorJson = JSON.parse(errorText)
        if (errorJson.errors) {
          errorDetails = Object.entries(errorJson.errors)
            .map(([key, value]) => `${key}: ${value}`)
            .join(", ")
        } else if (errorJson.errorMessages) {
          errorDetails = errorJson.errorMessages.join(", ")
        }
      } catch (e) {
        // Keep original error text
      }

      // Check if it's a permission issue
      if (createResponse.status === 403) {
        throw new Error(
          "Permission denied: You don't have permission to create projects in this Jira instance. Please contact your Jira administrator.",
        )
      } else if (createResponse.status === 400) {
        throw new Error(`Invalid project data: ${errorDetails}`)
      } else {
        throw new Error(`Failed to create project (${createResponse.status}): ${errorDetails}`)
      }
    }

    const createdProject = await createResponse.json()
    console.log("Created project:", createdProject)

    return NextResponse.json({
      success: true,
      project: {
        key: createdProject.key,
        name: createdProject.name,
        id: createdProject.id,
        url: `${JIRA_BASE_URL}/browse/${createdProject.key}`,
      },
    })
  } catch (error) {
    console.error("Error creating Jira project:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create project",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
