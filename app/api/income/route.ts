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
  const fromDate = searchParams.get("fromDate")
  const toDate = searchParams.get("toDate")
  const categoryId = searchParams.get("categoryId")

  // Build query
  let query = `
    SELECT i.*, c.name as category_name
    FROM income i
    LEFT JOIN categories c ON i.category_id = c.id
    WHERE i.user_id = ?
  `
  const queryParams = [user.id]

  // Add filters
  if (fromDate) {
    query += " AND i.date >= ?"
    queryParams.push(fromDate)
  }

  if (toDate) {
    query += " AND i.date <= ?"
    queryParams.push(toDate)
  }

  if (categoryId) {
    query += " AND i.category_id = ?"
    queryParams.push(categoryId)
  }

  query += " ORDER BY i.date DESC"

  try {
    const [income] = await db.query(query, queryParams)
    return NextResponse.json(income)
  } catch (error) {
    console.error("Error fetching income:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await authenticate()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { description, amount, date, category_id, notes } = await request.json()

    // Insert income
    const [result] = await db.query(
      `INSERT INTO income 
       (user_id, description, amount, date, category_id, notes) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user.id, description, amount, date, category_id, notes || null],
    )

    const incomeId = (result as any).insertId

    // Fetch the created income with category name
    const [income] = await db.query(
      `SELECT i.*, c.name as category_name
       FROM income i
       LEFT JOIN categories c ON i.category_id = c.id
       WHERE i.id = ?`,
      [incomeId],
    )

    return NextResponse.json((income as any[])[0])
  } catch (error) {
    console.error("Error creating income:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

