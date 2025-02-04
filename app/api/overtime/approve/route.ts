import { NextResponse } from "next/server"

const API_URL = "https://hris-api-kappa.vercel.app/api/v1/overtime"
const AUTH_TOKEN = "Bearer $2a$12$JSyMjCxUTNmGBlAQOQQeaOFrOdtdUmn.U/17DlvOK1t.Ot0BTRGli"

export async function POST(request: Request) {
  try {
    const { id, approvalType } = await request.json()

    const response = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: {
        Authorization: AUTH_TOKEN,
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

