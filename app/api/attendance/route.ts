import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const apiUrl = process.env.ATTENDANCE_API_URL
    const apiToken = Buffer.from(process.env.ATTENDANCE_API_TOKEN_B64 || "", "base64").toString("utf-8")

    if (!apiUrl || !apiToken) {
      return NextResponse.json({ error: "API configuration missing" }, { status: 500 })
    }

    const response = await fetch(apiUrl, {
      method: "GET",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return new NextResponse(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch (error) {
    console.error("Error fetching attendance data:", error)
    return NextResponse.json({ error: "Failed to fetch attendance data" }, { status: 500 })
  }
}
