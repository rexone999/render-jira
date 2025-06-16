import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("Atlassian Connect app disabled:", body)

    return NextResponse.json({
      success: true,
      message: "App disabled successfully",
    })
  } catch (error) {
    console.error("Error during app disable:", error)
    return NextResponse.json({ error: "Disable failed" }, { status: 500 })
  }
}
