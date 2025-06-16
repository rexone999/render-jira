import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { brdContent, projectName } = await request.json()

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `
You are an expert Product Owner and Business Analyst. Analyze the following Business Requirements Document and generate comprehensive EPICs and User Stories.

Project Name: ${projectName}

BRD Content:
${brdContent}

Please generate:
1. 2-4 EPICs that group related functionality
2. 8-15 detailed User Stories under these EPICs
3. Each story should include:
   - Clear title
   - Detailed description in "As a [user], I want [goal] so that [benefit]" format
   - 3-5 acceptance criteria
   - Priority (High/Medium/Low)
   - Story points estimate (1, 2, 3, 5, 8, 13)

Return the response as a JSON object with this structure:
{
  "stories": [
    {
      "id": "unique-id",
      "type": "epic" or "story",
      "title": "Story Title",
      "description": "Detailed description",
      "acceptanceCriteria": ["criteria 1", "criteria 2", "criteria 3"],
      "priority": "High" | "Medium" | "Low",
      "storyPoints": number (only for stories, not epics),
      "parentEpic": "epic-id" (only for stories)
    }
  ]
}

Make sure the stories are practical, testable, and follow INVEST principles (Independent, Negotiable, Valuable, Estimable, Small, Testable).
`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("No valid JSON found in response")
    }

    const parsedResponse = JSON.parse(jsonMatch[0])

    // Add unique IDs if not present
    parsedResponse.stories = parsedResponse.stories.map((story: any, index: number) => ({
      ...story,
      id: story.id || `story-${Date.now()}-${index}`,
    }))

    return NextResponse.json(parsedResponse)
  } catch (error) {
    console.error("Error generating stories:", error)
    return NextResponse.json({ error: "Failed to generate stories" }, { status: 500 })
  }
}
