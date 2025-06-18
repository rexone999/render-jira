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
      availableIssueTypes.map((t: any) => ({ id: t.id, name: t.name, subtask: t.subtask })),
    )

    // Filter out sub-task issue types and find appropriate types
    const regularIssueTypes = availableIssueTypes.filter((type: any) => !type.subtask)

    console.log(
      "Regular (non-subtask) issue types:",
      regularIssueTypes.map((t: any) => ({ id: t.id, name: t.name })),
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
    const failedStories = []

    // Create issues in Jira - Only EPICs and Stories
    for (const story of stories) {
      try {
        // Only allow publishing if type is exactly 'epic' or 'story'
        if (story.type !== "epic" && story.type !== "story") {
          console.log(`Skipping ${story.type} - only creating EPICs and Stories`)
          continue
        }

        let selectedIssueType = null;
        let usedType = null;

        if (story.type === "epic") {
          if (epicIssueType) {
            selectedIssueType = epicIssueType;
            usedType = epicIssueType.name;
          } else {
            const msg = `No Epic issue type found for epic: ${story.title}`;
            console.error(msg);
            failedStories.push({ ...story, error: msg });
            continue;
          }
        } else if (story.type === "story") {
          if (storyIssueType) {
            selectedIssueType = storyIssueType;
            usedType = storyIssueType.name;
          } else {
            const msg = `No Story issue type found for story: ${story.title}`;
            console.error(msg);
            failedStories.push({ ...story, error: msg });
            continue;
          }
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
            usedType,
          })
          console.log(`Successfully created ${story.type}: ${createdIssue.key}`)
        } else {
          const errorText = await createResponse.text()
          const msg = `Failed to create ${story.type} for story ${storyTitle} (type: ${usedType}): ${errorText}`;
          console.error(msg)
          failedStories.push({ ...story, error: msg });
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
              usedType,
            })
            console.log(`Successfully created minimal ${story.type}: ${createdIssue.key}`)
          } else {
            const retryErrorText = await retryResponse.text()
            const retryMsg = `Failed to create minimal ${story.type} for story ${storyTitle} (type: ${usedType}): ${retryErrorText}`;
            console.error(retryMsg)
            failedStories.push({ ...story, error: retryMsg });
          }
        }
      } catch (storyError) {
        const catchMsg = `Exception for story ${story.title}: ${storyError}`;
        console.error(catchMsg);
        failedStories.push({ ...story, error: catchMsg });
      }
    }

    return NextResponse.json({
      message: `Published ${publishedStories.length} stories to Jira backlog.`,
      publishedCount: publishedStories.length,
      totalStories: stories.length,
      publishedStories,
      failedStories,
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
