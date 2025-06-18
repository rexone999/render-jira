import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json()

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    // Build conversation context
    const conversationHistory = history
      .slice(-10) // Keep last 10 messages for context
      .map((msg: any) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
      .join("\n")

    const prompt = `
You are PO Assist, an expert AI assistant. For the following topic, generate 2-3 epics. For each epic, you MUST generate 3-5 user stories that are directly related to that epic. Output each epic and each user story as a separate block in this format:

Title: [title]
Description: [description]
Type: [epic|story]
Priority: [High|Medium|Low]
Acceptance Criteria:
- [criteria 1]
- [criteria 2]

For each user story, use a unique, descriptive title that clearly reflects the specific functionality or requirement. Do not use the epic title as the story title. Make sure each story is clearly related to its parent epic.

Do not include explanations or markdown, only the stories in the above format. Do NOT output only epics; you MUST output user stories for each epic.

If the user provides a BRD or requirements, use that as context. If not, use your own knowledge to generate relevant epics and stories for the topic.

Previous conversation:
${conversationHistory}

Current user message: ${message}
`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    return NextResponse.json({ response: text })
  } catch (error) {
    console.error("Error in chat:", error)
    return NextResponse.json({ error: "Failed to get response" }, { status: 500 })
  }
}
