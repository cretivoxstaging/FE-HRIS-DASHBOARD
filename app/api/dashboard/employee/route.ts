import { NextResponse } from "next/server"

const DASHBOARD_API_URL = process.env.DASHBOARD_API_URL || ""
const API_TOKEN = Buffer.from(process.env.DASHBOARD_API_TOKEN_B64 || "", "base64").toString("utf-8")

// GET - Fetch employee data for dashboard
export async function GET() {
  try {
    const response = await fetch(`${DASHBOARD_API_URL}/employee`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error("Failed to fetch employee data")
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching dashboard employee data:", error)
    return NextResponse.json({ error: "Failed to fetch employee data" }, { status: 500 })
  }
}
