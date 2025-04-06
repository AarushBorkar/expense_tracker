import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { authenticate } from "@/lib/auth-middleware"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const user = await authenticate()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const [budgets] = await db.query(
      `SELECT b.*, c.name as category_name
       FROM budgets b
       LEFT JOIN categories c ON b.category_id = c.id
       WHERE b.id = ? AND b.user_id = ?`,
      [params.id, user.id],
    )

    if (!budgets || (budgets as any[]).length === 0) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 })
    }

    return NextResponse.json((budgets as any[])[0])
  } catch (error) {
    console.error("Error fetching budget:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const user = await authenticate()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { category_id, amount } = await request.json()

    // Check if budget exists and belongs to user
    const [budgets] = await db.query("SELECT id, month, year FROM budgets WHERE id = ? AND user_id = ?", [
      params.id,
      user.id,
    ])

    if (!budgets || (budgets as any[]).length === 0) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 })
    }

    // Update budget
    await db.query(
      `UPDATE budgets 
       SET category_id = ?, amount = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [category_id, amount, params.id, user.id],
    )

    // Fetch the updated budget
    const [updatedBudgets] = await db.query(
      `SELECT b.*, c.name as category_name
       FROM budgets b
       LEFT JOIN categories c ON b.category_id = c.id
       WHERE b.id = ?`,
      [params.id],
    )

    return NextResponse.json((updatedBudgets as any[])[0])
  } catch (error) {
    console.error("Error updating budget:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const user = await authenticate()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Check if budget exists and belongs to user
    const [budgets] = await db.query("SELECT id FROM budgets WHERE id = ? AND user_id = ?", [params.id, user.id])

    if (!budgets || (budgets as any[]).length === 0) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 })
    }

    // Delete budget
    await db.query("DELETE FROM budgets WHERE id = ? AND user_id = ?", [params.id, user.id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting budget:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

