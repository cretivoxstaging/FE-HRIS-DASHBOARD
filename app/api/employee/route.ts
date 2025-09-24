import { type NextRequest, NextResponse } from "next/server"

const EMPLOYEE_API_URL = process.env.EMPLOYEE_API_URL || ""
const API_TOKEN = Buffer.from(process.env.API_TOKEN_B64 || "", "base64").toString("utf-8")

// GET - Fetch all employees
export async function GET() {
  try {
    const response = await fetch(EMPLOYEE_API_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch employees")
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching employees:", error)
    return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 })
  }
}

// POST - Create new employee
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const response = await fetch(EMPLOYEE_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error("Failed to create employee")
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error creating employee:", error)
    return NextResponse.json({ error: "Failed to create employee" }, { status: 500 })
  }
}
