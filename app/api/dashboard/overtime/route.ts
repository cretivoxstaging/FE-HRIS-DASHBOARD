import { NextResponse } from "next/server"

const DASHBOARD_API_URL = process.env.DASHBOARD_API_URL || ""
const API_TOKEN = Buffer.from(process.env.DASHBOARD_API_TOKEN_B64 || "", "base64").toString("utf-8")

// GET - Fetch overtime data for dashboard
export async function GET() {
  try {
    const response = await fetch(`${DASHBOARD_API_URL}/overtime?pageSize=1000`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error("Failed to fetch overtime data")
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching dashboard overtime data:", error)
    return NextResponse.json({ error: "Failed to fetch overtime data" }, { status: 500 })
  }
}
