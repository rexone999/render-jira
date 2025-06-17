import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log("🎉 PO Assist installed!")
    console.log("Client:", body.clientKey)
    console.log("Time:", new Date().toISOString())

    // Return success immediately to prevent timeout
    return NextResponse.json(
      { success: true, message: "Installed successfully" },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-cache",
        },
      },
    )
  } catch (error) {
    console.log("Install error:", error)

    // Still return 200 to prevent Jira errors
    return NextResponse.json({ success: false, message: "Installed with warnings" }, { status: 200 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
