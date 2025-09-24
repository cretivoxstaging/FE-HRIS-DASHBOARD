import { type NextRequest, NextResponse } from "next/server"

const OVERTIME_API_URL = process.env.OVERTIME_API_URL || ""
const API_TOKEN = Buffer.from(process.env.API_TOKEN_B64 || "", "base64").toString("utf-8")

export async function POST(request: NextRequest) {
  try {
    const { id, approvalType } = await request.json()

    const response = await fetch(`${OVERTIME_API_URL}/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        [`${approvalType}_approval`]: "Approved",
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to update approval status")
    }

    const updatedOvertime = await response.json()
    return NextResponse.json(updatedOvertime)
  } catch (error) {
    console.error("Error updating approval status:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
