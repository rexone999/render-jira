import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory } = await request.json()

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    // Extract BRD content from conversation history
    const conversationText = conversationHistory.map((msg: any) => `${msg.role}: ${msg.content}`).join("\n")

    const prompt = `
You are an expert Product Owner and Business Analyst. The user has provided BRD content in our conversation and is asking you to generate user stories.

Conversation History:
${conversationText}

Current Request: ${message}

Based on the BRD content mentioned in our conversation, please:

1. Generate 2-4 EPICs that group related functionality
2. Generate 8-15 detailed User Stories under these EPICs
3. Each story should include:
   - Clear title
   - Detailed description in "As a [user], I want [goal] so that [benefit]" format
   - 3-5 acceptance criteria
   - Priority (High/Medium/Low)
   - Story points estimate (1, 2, 3, 5, 8, 13)

First, provide a conversational response explaining what you're doing, then return the stories in JSON format.

Response format:
{
  "response": "Your conversational response explaining the story generation",
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

Make sure the stories are practical, testable, and follow INVEST principles.
`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      // If no JSON found, return a regular chat response
      return NextResponse.json({
        response: text,
        stories: [],
      })
    }

    const parsedResponse = JSON.parse(jsonMatch[0])

    // Add unique IDs if not present
    if (parsedResponse.stories) {
      parsedResponse.stories = parsedResponse.stories.map((story: any, index: number) => ({
        ...story,
        id: story.id || `story-${Date.now()}-${index}`,
      }))
    }

    return NextResponse.json(parsedResponse)
  } catch (error) {
    console.error("Error generating stories from chat:", error)
    return NextResponse.json({
      response: "I encountered an error while generating stories. Please try again with your BRD content.",
      stories: [],
    })
  }
}
