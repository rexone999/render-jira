import { type NextRequest, NextResponse } from "next/server"

const JIRA_BASE_URL = process.env.JIRA_BASE_URL
const JIRA_EMAIL = process.env.JIRA_EMAIL
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN

export async function POST(request: NextRequest) {
  try {
    const { stories, projectKey } = await request.json()

    if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) {
      throw new Error("Jira configuration missing")
    }

    if (!projectKey) {
      throw new Error("Project key is required")
    }

    const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64")

    // Get issue types for the specific project
    const projectIssueTypesResponse = await fetch(`${JIRA_BASE_URL}/rest/api/3/project/${projectKey}`, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
    })

    let availableIssueTypes = []
    if (projectIssueTypesResponse.ok) {
      const projectData = await projectIssueTypesResponse.json()
      availableIssueTypes = projectData.issueTypes || []
    } else {
      // Fallback to global issue types
      const issueTypesResponse = await fetch(`${JIRA_BASE_URL}/rest/api/3/issuetype`, {
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: "application/json",
        },
      })
      if (issueTypesResponse.ok) {
        availableIssueTypes = await issueTypesResponse.json()
      }
    }

    console.log(
      "Available issue types:",
      availableIssueTypes.map((t) => ({ id: t.id, name: t.name, subtask: t.subtask })),
    )

    // Filter out sub-task issue types and find appropriate types
    const regularIssueTypes = availableIssueTypes.filter((type: any) => !type.subtask)

    console.log(
      "Regular (non-subtask) issue types:",
      regularIssueTypes.map((t) => ({ id: t.id, name: t.name })),
    )

    // Find specific issue types for EPICs and Stories only
    const epicIssueType = regularIssueTypes.find((type: any) => {
      const name = type.name?.toLowerCase() || ""
      return name.includes("epic")
    })

    const storyIssueType = regularIssueTypes.find((type: any) => {
      const name = type.name?.toLowerCase() || ""
      return name.includes("story") || name.includes("user story")
    })

    // If no Story type found, try Task as fallback for stories
    const taskIssueType = regularIssueTypes.find((type: any) => {
      const name = type.name?.toLowerCase() || ""
      return name.includes("task") && !name.includes("sub")
    })

    // Final fallback - use first regular issue type
    const fallbackIssueType = regularIssueTypes[0]

    console.log("Selected issue types:", {
      epic: epicIssueType ? { id: epicIssueType.id, name: epicIssueType.name } : null,
      story: storyIssueType ? { id: storyIssueType.id, name: storyIssueType.name } : null,
      task: taskIssueType ? { id: taskIssueType.id, name: taskIssueType.name } : null,
      fallback: fallbackIssueType ? { id: fallbackIssueType.id, name: fallbackIssueType.name } : null,
    })

    const publishedStories = []

    // Create issues in Jira - Only EPICs and Stories
    for (const story of stories) {
      try {
        // Skip if not epic or story
        if (story.type !== "epic" && story.type !== "story") {
          console.log(`Skipping ${story.type} - only creating EPICs and Stories`)
          continue
        }

        // Select appropriate issue type
        let selectedIssueType = null

        if (story.type === "epic" && epicIssueType) {
          selectedIssueType = epicIssueType
        } else if (story.type === "story") {
          // Try Story type first, then Task, then fallback
          selectedIssueType = storyIssueType || taskIssueType || fallbackIssueType
        }

        if (!selectedIssueType) {
          console.error(`No suitable issue type found for ${story.type}: ${story.title}`)
          continue
        }

        console.log(`Using issue type for "${story.title}": ${selectedIssueType.name} (ID: ${selectedIssueType.id})`)

        // Ensure we have required fields with fallbacks
        const storyTitle = story.title || "Untitled Story"
        const storyDescription = story.description || "No description provided"

        // Build description with acceptance criteria
        const descriptionContent = [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: storyDescription,
              },
            ],
          },
        ]

        // Add acceptance criteria if available
        if (
          story.acceptanceCriteria &&
          Array.isArray(story.acceptanceCriteria) &&
          story.acceptanceCriteria.length > 0
        ) {
          descriptionContent.push(
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Acceptance Criteria:",
                  marks: [{ type: "strong" }],
                },
              ],
            },
            {
              type: "bulletList",
              content: story.acceptanceCriteria
                .filter((criteria: any) => criteria && typeof criteria === "string")
                .map((criteria: string) => ({
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [
                        {
                          type: "text",
                          text: criteria,
                        },
                      ],
                    },
                  ],
                })),
            },
          )
        }

        // Build the basic issue data - NO PRIORITY FIELD
        const issueData: any = {
          fields: {
            project: {
              key: projectKey,
            },
            summary: storyTitle,
            description: {
              type: "doc",
              version: 1,
              content: descriptionContent,
            },
            issuetype: {
              id: selectedIssueType.id,
            },
          },
        }

        console.log(`Creating ${story.type} with data:`, JSON.stringify(issueData, null, 2))

        const createResponse = await fetch(`${JIRA_BASE_URL}/rest/api/3/issue`, {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(issueData),
        })

        if (createResponse.ok) {
          const createdIssue = await createResponse.json()
          publishedStories.push({
            ...story,
            jiraKey: createdIssue.key,
            jiraId: createdIssue.id,
          })
          console.log(`Successfully created ${story.type}: ${createdIssue.key}`)
        } else {
          const errorText = await createResponse.text()
          console.error(`Failed to create ${story.type} for story ${storyTitle}:`, errorText)

          // Try creating with even more minimal fields if the full creation failed
          const minimalIssueData = {
            fields: {
              project: {
                key: projectKey,
              },
              summary: storyTitle,
              issuetype: {
                id: selectedIssueType.id,
              },
            },
          }

          console.log(`Retrying with minimal data:`, JSON.stringify(minimalIssueData, null, 2))

          const retryResponse = await fetch(`${JIRA_BASE_URL}/rest/api/3/issue`, {
            method: "POST",
            headers: {
              Authorization: `Basic ${auth}`,
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify(minimalIssueData),
          })

          if (retryResponse.ok) {
            const createdIssue = await retryResponse.json()
            publishedStories.push({
              ...story,
              jiraKey: createdIssue.key,
              jiraId: createdIssue.id,
            })
            console.log(`Successfully created minimal ${story.type}: ${createdIssue.key}`)
          } else {
            const retryErrorText = await retryResponse.text()
            console.error(`Failed to create minimal ${story.type} for story ${storyTitle}:`, retryErrorText)
          }
        }
      } catch (storyError) {
        console.error(`Error processing ${story.type} ${story.title || "Unknown"}:`, storyError)
        // Continue with next story instead of failing completely
        continue
      }
    }

    return NextResponse.json({
      success: true,
      publishedCount: publishedStories.length,
      totalStories: stories.filter((s) => s.type === "epic" || s.type === "story").length,
      stories: publishedStories,
      projectKey: projectKey,
      message:
        publishedStories.length === stories.filter((s) => s.type === "epic" || s.type === "story").length
          ? "All EPICs and Stories published successfully!"
          : `${publishedStories.length} out of ${stories.filter((s) => s.type === "epic" || s.type === "story").length} EPICs and Stories published successfully.`,
    })
  } catch (error) {
    console.error("Error publishing to Jira:", error)
    return NextResponse.json(
      {
        error: "Failed to publish stories to Jira",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
