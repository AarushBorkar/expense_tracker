import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { authenticate } from "@/lib/auth-middleware"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const user = await authenticate()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const [income] = await db.query(
      `SELECT i.*, c.name as category_name
       FROM income i
       LEFT JOIN categories c ON i.category_id = c.id
       WHERE i.id = ? AND i.user_id = ?`,
      [params.id, user.id],
    )

    if (!income || (income as any[]).length === 0) {
      return NextResponse.json({ error: "Income not found" }, { status: 404 })
    }

    return NextResponse.json((income as any[])[0])
  } catch (error) {
    console.error("Error fetching income:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const user = await authenticate()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { description, amount, date, category_id, notes } = await request.json()

    // Check if income exists and belongs to user
    const [incomeRecords] = await db.query("SELECT id FROM income WHERE id = ? AND user_id = ?", [params.id, user.id])

    if (!incomeRecords || (incomeRecords as any[]).length === 0) {
      return NextResponse.json({ error: "Income not found" }, { status: 404 })
    }

    // Update income
    await db.query(
      `UPDATE income 
       SET description = ?, amount = ?, date = ?, 
           category_id = ?, notes = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [description, amount, date, category_id, notes || null, params.id, user.id],
    )

    // Fetch the updated income
    const [updatedIncome] = await db.query(
      `SELECT i.*, c.name as category_name
       FROM income i
       LEFT JOIN categories c ON i.category_id = c.id
       WHERE i.id = ?`,
      [params.id],
    )

    return NextResponse.json((updatedIncome as any[])[0])
  } catch (error) {
    console.error("Error updating income:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const user = await authenticate()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Check if income exists and belongs to user
    const [incomeRecords] = await db.query("SELECT id FROM income WHERE id = ? AND user_id = ?", [params.id, user.id])

    if (!incomeRecords || (incomeRecords as any[]).length === 0) {
      return NextResponse.json({ error: "Income not found" }, { status: 404 })
    }

    // Delete income
    await db.query("DELETE FROM income WHERE id = ? AND user_id = ?", [params.id, user.id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting income:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

