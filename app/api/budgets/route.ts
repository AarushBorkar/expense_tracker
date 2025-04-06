import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { authenticate } from "@/lib/auth-middleware"

export async function GET(request: Request) {
  const user = await authenticate()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get query parameters
  const { searchParams } = new URL(request.url)
  const month = searchParams.get("month")
  const year = searchParams.get("year")

  // Build query
  let query = `
    SELECT b.*, c.name as category_name
    FROM budgets b
    LEFT JOIN categories c ON b.category_id = c.id
    WHERE b.user_id = ?
  `
  const queryParams = [user.id]

  // Add filters
  if (month) {
    query += " AND b.month = ?"
    queryParams.push(month)
  }

  if (year) {
    query += " AND b.year = ?"
    queryParams.push(year)
  }

  query += " ORDER BY c.name"

  try {
    const [budgets] = await db.query(query, queryParams)
    return NextResponse.json(budgets)
  } catch (error) {
    console.error("Error fetching budgets:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await authenticate()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { category_id, amount, month, year } = await request.json()

    // Check if budget already exists for this category, month, and year
    const [existingBudgets] = await db.query(
      "SELECT id FROM budgets WHERE user_id = ? AND category_id = ? AND month = ? AND year = ?",
      [user.id, category_id, month, year],
    )

    if (existingBudgets && (existingBudgets as any[]).length > 0) {
      // Update existing budget
      await db.query("UPDATE budgets SET amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [
        amount,
        (existingBudgets as any[])[0].id,
      ])

      const budgetId = (existingBudgets as any[])[0].id

      // Fetch the updated budget
      const [budgets] = await db.query(
        `SELECT b.*, c.name as category_name
         FROM budgets b
         LEFT JOIN categories c ON b.category_id = c.id
         WHERE b.id = ?`,
        [budgetId],
      )

      return NextResponse.json((budgets as any[])[0])
    } else {
      // Insert new budget
      const [result] = await db.query(
        "INSERT INTO budgets (user_id, category_id, amount, month, year) VALUES (?, ?, ?, ?, ?)",
        [user.id, category_id, amount, month, year],
      )

      const budgetId = (result as any).insertId

      // Fetch the created budget
      const [budgets] = await db.query(
        `SELECT b.*, c.name as category_name
         FROM budgets b
         LEFT JOIN categories c ON b.category_id = c.id
         WHERE b.id = ?`,
        [budgetId],
      )

      return NextResponse.json((budgets as any[])[0])
    }
  } catch (error) {
    console.error("Error creating/updating budget:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

