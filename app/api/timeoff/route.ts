import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const apiUrl = process.env.TIMEOFF_API_URL
    const token = Buffer.from(process.env.TIMEOFF_API_TOKEN_B64 || "", "base64").toString("utf-8")

    if (!apiUrl || !token) {
      return NextResponse.json({ error: "API configuration missing" }, { status: 500 })
    }

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching time off data:", error)
    return NextResponse.json({ error: "Failed to fetch time off data" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const apiUrl = process.env.TIMEOFF_API_URL
    const token = Buffer.from(process.env.TIMEOFF_API_TOKEN_B64 || "", "base64").toString("utf-8")

    if (!apiUrl || !token) {
      return NextResponse.json({ error: "API configuration missing" }, { status: 500 })
    }

    const body = await req.json().catch(() => ({}))
    const timeoffId = body?.timeoffId ?? body?.id

    if (!timeoffId) {
      return NextResponse.json({ error: "timeoffId is required" }, { status: 400 })
    }

    // Forward to upstream decrement endpoint
    const response = await fetch(`${apiUrl}/decrement-leave`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ timeoffId }),
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      return NextResponse.json(data || { error: "Failed to decrement leave" }, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error decrementing leave:", error)
    return NextResponse.json({ error: "Failed to decrement leave" }, { status: 500 })
  }
}
