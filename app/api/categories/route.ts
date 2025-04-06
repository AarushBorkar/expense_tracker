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
  const type = searchParams.get("type") || "expense"

  try {
    const [categories] = await db.query("SELECT * FROM categories WHERE user_id = ? AND type = ? ORDER BY name", [
      user.id,
      type,
    ])

    return NextResponse.json(categories)
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await authenticate()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { name, type } = await request.json()

    // Check if category already exists
    const [existingCategories] = await db.query(
      "SELECT id FROM categories WHERE user_id = ? AND name = ? AND type = ?",
      [user.id, name, type],
    )

    if (existingCategories && (existingCategories as any[]).length > 0) {
      return NextResponse.json({ error: "Category already exists" }, { status: 400 })
    }

    // Insert category
    const [result] = await db.query("INSERT INTO categories (user_id, name, type) VALUES (?, ?, ?)", [
      user.id,
      name,
      type,
    ])

    const categoryId = (result as any).insertId

    // Fetch the created category
    const [categories] = await db.query("SELECT * FROM categories WHERE id = ?", [categoryId])

    return NextResponse.json((categories as any[])[0])
  } catch (error) {
    console.error("Error creating category:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

