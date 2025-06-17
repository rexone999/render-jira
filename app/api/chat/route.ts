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
You are PO Assist, an expert AI assistant specializing in Product Management, Agile methodologies, User Stories, EPICs, and software development best practices.

You help Product Owners, Business Analysts, and development teams with:
- Writing and refining user stories and EPICs
- Agile and Scrum guidance
- Product management best practices
- Requirements analysis
- Backlog management
- Sprint planning
- Stakeholder communication

Previous conversation:
${conversationHistory}

Current user message: ${message}

Provide helpful, practical, and actionable advice. Be concise but thorough. If the question is outside your expertise area, still try to provide general helpful guidance while acknowledging the limitation.
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
