import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { authenticate } from "@/lib/auth-middleware"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const user = await authenticate()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const [expenses] = await db.query(
      `SELECT e.*, c.name as category_name, pm.name as payment_method_name
       FROM expenses e
       LEFT JOIN categories c ON e.category_id = c.id
       LEFT JOIN payment_methods pm ON e.payment_method_id = pm.id
       WHERE e.id = ? AND e.user_id = ?`,
      [params.id, user.id],
    )

    if (!expenses || (expenses as any[]).length === 0) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 })
    }

    return NextResponse.json((expenses as any[])[0])
  } catch (error) {
    console.error("Error fetching expense:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const user = await authenticate()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { description, amount, date, category_id, payment_method_id, notes } = await request.json()

    // Check if expense exists and belongs to user
    const [expenses] = await db.query("SELECT id FROM expenses WHERE id = ? AND user_id = ?", [params.id, user.id])

    if (!expenses || (expenses as any[]).length === 0) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 })
    }

    // Update expense
    await db.query(
      `UPDATE expenses 
       SET description = ?, amount = ?, date = ?, 
           category_id = ?, payment_method_id = ?, notes = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [description, amount, date, category_id, payment_method_id, notes || null, params.id, user.id],
    )

    // Fetch the updated expense
    const [updatedExpenses] = await db.query(
      `SELECT e.*, c.name as category_name, pm.name as payment_method_name
       FROM expenses e
       LEFT JOIN categories c ON e.category_id = c.id
       LEFT JOIN payment_methods pm ON e.payment_method_id = pm.id
       WHERE e.id = ?`,
      [params.id],
    )

    return NextResponse.json((updatedExpenses as any[])[0])
  } catch (error) {
    console.error("Error updating expense:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const user = await authenticate()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Check if expense exists and belongs to user
    const [expenses] = await db.query("SELECT id FROM expenses WHERE id = ? AND user_id = ?", [params.id, user.id])

    if (!expenses || (expenses as any[]).length === 0) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 })
    }

    // Delete expense
    await db.query("DELETE FROM expenses WHERE id = ? AND user_id = ?", [params.id, user.id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting expense:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

