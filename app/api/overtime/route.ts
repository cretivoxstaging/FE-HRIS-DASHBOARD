import { NextResponse } from "next/server"

const OVERTIME_API_URL = process.env.OVERTIME_API_URL || ""
const API_TOKEN = Buffer.from(process.env.API_TOKEN_B64 || "", "base64").toString("utf-8")

// GET - Fetch all overtime requests
export async function GET() {
  try {
    const response = await fetch(`${OVERTIME_API_URL}?pageSize=1000`, {
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
    console.error("Error fetching overtime data:", error)
    return NextResponse.json({ error: "Failed to fetch overtime data" }, { status: 500 })
  }
}
