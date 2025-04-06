import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { authenticate } from "@/lib/auth-middleware"

export async function GET() {
  const user = await authenticate()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const [paymentMethods] = await db.query("SELECT * FROM payment_methods WHERE user_id = ? ORDER BY name", [user.id])

    return NextResponse.json(paymentMethods)
  } catch (error) {
    console.error("Error fetching payment methods:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await authenticate()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { name } = await request.json()

    // Check if payment method already exists
    const [existingMethods] = await db.query("SELECT id FROM payment_methods WHERE user_id = ? AND name = ?", [
      user.id,
      name,
    ])

    if (existingMethods && (existingMethods as any[]).length > 0) {
      return NextResponse.json({ error: "Payment method already exists" }, { status: 400 })
    }

    // Insert payment method
    const [result] = await db.query("INSERT INTO payment_methods (user_id, name) VALUES (?, ?)", [user.id, name])

    const methodId = (result as any).insertId

    // Fetch the created payment method
    const [methods] = await db.query("SELECT * FROM payment_methods WHERE id = ?", [methodId])

    return NextResponse.json((methods as any[])[0])
  } catch (error) {
    console.error("Error creating payment method:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

