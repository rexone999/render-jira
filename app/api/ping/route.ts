// ✅ Setup uptime pinger (cron) - Endpoint for external monitoring
import { NextResponse } from "next/server"

export async function GET() {
  const pingData = {
    status: "pong",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    env: process.env.NODE_ENV,
    version: "1.0.0",
  }

  return NextResponse.json(pingData, {
    status: 200,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Access-Control-Allow-Origin": "*",
    },
  })
}

export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  })
}
