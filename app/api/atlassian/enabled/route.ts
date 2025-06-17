import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("Atlassian Connect app enabled:", body)

    return NextResponse.json({
      success: true,
      message: "App enabled successfully",
    })
  } catch (error) {
    console.error("Error during app enable:", error)
    return NextResponse.json({ error: "Enable failed" }, { status: 500 })
  }
}
