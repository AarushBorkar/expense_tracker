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
  const paymentMethodId = searchParams.get("paymentMethodId")

  // Build query
  let query = `
    SELECT e.*, c.name as category_name, pm.name as payment_method_name
    FROM expenses e
    LEFT JOIN categories c ON e.category_id = c.id
    LEFT JOIN payment_methods pm ON e.payment_method_id = pm.id
    WHERE e.user_id = ?
  `
  const queryParams = [user.id]

  // Add filters
  if (fromDate) {
    query += " AND e.date >= ?"
    queryParams.push(fromDate)
  }

  if (toDate) {
    query += " AND e.date <= ?"
    queryParams.push(toDate)
  }

  if (categoryId) {
    query += " AND e.category_id = ?"
    queryParams.push(categoryId)
  }

  if (paymentMethodId) {
    query += " AND e.payment_method_id = ?"
    queryParams.push(paymentMethodId)
  }

  query += " ORDER BY e.date DESC"

  try {
    const [expenses] = await db.query(query, queryParams)
    return NextResponse.json(expenses)
  } catch (error) {
    console.error("Error fetching expenses:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await authenticate()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { description, amount, date, category_id, payment_method_id, notes } = await request.json()

    // Insert expense
    const [result] = await db.query(
      `INSERT INTO expenses 
       (user_id, description, amount, date, category_id, payment_method_id, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user.id, description, amount, date, category_id, payment_method_id, notes || null],
    )

    const expenseId = (result as any).insertId

    // Fetch the created expense with category and payment method names
    const [expenses] = await db.query(
      `SELECT e.*, c.name as category_name, pm.name as payment_method_name
       FROM expenses e
       LEFT JOIN categories c ON e.category_id = c.id
       LEFT JOIN payment_methods pm ON e.payment_method_id = pm.id
       WHERE e.id = ?`,
      [expenseId],
    )

    return NextResponse.json((expenses as any[])[0])
  } catch (error) {
    console.error("Error creating expense:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

