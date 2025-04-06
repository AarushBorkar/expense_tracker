import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { authenticate } from "@/lib/auth-middleware"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const user = await authenticate()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const [goals] = await db.query(
      `SELECT g.*, c.name as category_name
       FROM financial_goals g
       LEFT JOIN categories c ON g.category_id = c.id
       WHERE g.id = ? AND g.user_id = ?`,
      [params.id, user.id],
    )

    if (!goals || (goals as any[]).length === 0) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 })
    }

    return NextResponse.json((goals as any[])[0])
  } catch (error) {
    console.error("Error fetching goal:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const user = await authenticate()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { title, description, target_amount, current_amount, start_date, target_date, category_id, is_completed } =
      await request.json()

    // Check if goal exists and belongs to user
    const [goals] = await db.query("SELECT id FROM financial_goals WHERE id = ? AND user_id = ?", [params.id, user.id])

    if (!goals || (goals as any[]).length === 0) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 })
    }

    // Update goal
    await db.query(
      `UPDATE financial_goals 
       SET title = ?, description = ?, target_amount = ?, current_amount = ?, 
           start_date = ?, target_date = ?, category_id = ?, is_completed = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [
        title,
        description,
        target_amount,
        current_amount,
        start_date,
        target_date,
        category_id || null,
        is_completed,
        params.id,
        user.id,
      ],
    )

    // Fetch the updated goal
    const [updatedGoals] = await db.query(
      `SELECT g.*, c.name as category_name
       FROM financial_goals g
       LEFT JOIN categories c ON g.category_id = c.id
       WHERE g.id = ?`,
      [params.id],
    )

    return NextResponse.json((updatedGoals as any[])[0])
  } catch (error) {
    console.error("Error updating goal:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const user = await authenticate()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Check if goal exists and belongs to user
    const [goals] = await db.query("SELECT id FROM financial_goals WHERE id = ? AND user_id = ?", [params.id, user.id])

    if (!goals || (goals as any[]).length === 0) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 })
    }

    // Delete goal
    await db.query("DELETE FROM financial_goals WHERE id = ? AND user_id = ?", [params.id, user.id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting goal:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

