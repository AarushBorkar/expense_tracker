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
  const isCompleted = searchParams.get("isCompleted")

  // Build query
  let query = `
    SELECT g.*, c.name as category_name
    FROM financial_goals g
    LEFT JOIN categories c ON g.category_id = c.id
    WHERE g.user_id = ?
  `
  const queryParams = [user.id]

  // Add filters
  if (isCompleted !== null) {
    query += " AND g.is_completed = ?"
    queryParams.push(isCompleted === "true" ? 1 : 0)
  }

  query += " ORDER BY g.target_date ASC"

  try {
    const [goals] = await db.query(query, queryParams)
    return NextResponse.json(goals)
  } catch (error) {
    console.error("Error fetching goals:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await authenticate()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { title, description, target_amount, current_amount, start_date, target_date, category_id, is_completed } =
      await request.json()

    // Insert goal
    const [result] = await db.query(
      `INSERT INTO financial_goals 
       (user_id, title, description, target_amount, current_amount, start_date, target_date, category_id, is_completed) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id,
        title,
        description,
        target_amount,
        current_amount || 0,
        start_date,
        target_date,
        category_id || null,
        is_completed || false,
      ],
    )

    const goalId = (result as any).insertId

    // Fetch the created goal
    const [goals] = await db.query(
      `SELECT g.*, c.name as category_name
       FROM financial_goals g
       LEFT JOIN categories c ON g.category_id = c.id
       WHERE g.id = ?`,
      [goalId],
    )

    return NextResponse.json((goals as any[])[0])
  } catch (error) {
    console.error("Error creating goal:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

