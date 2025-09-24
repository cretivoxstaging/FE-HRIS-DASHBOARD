import { NextRequest, NextResponse } from "next/server"

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const apiUrl = process.env.TIMEOFF_API_URL
    const token = Buffer.from(process.env.TIMEOFF_API_TOKEN_B64 || "", "base64").toString("utf-8")

    if (!apiUrl || !token) {
      return NextResponse.json({ error: "API configuration missing" }, { status: 500 })
    }

    const id = params.id
    const body = await req.json()

    const response = await fetch(`${apiUrl}/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      return NextResponse.json(data || { error: "Failed to update time off" }, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error updating time off:", error)
    return NextResponse.json({ error: "Failed to update time off" }, { status: 500 })
  }
}


