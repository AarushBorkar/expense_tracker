import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { createSession } from "@/lib/session"
import bcrypt from "bcrypt"

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json()

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if user already exists
    const [existingUsers] = await db.query("SELECT id FROM users WHERE email = ?", [email])

    if (existingUsers && (existingUsers as any[]).length > 0) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create new user
    const [result] = await db.query("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", [
      name,
      email,
      hashedPassword,
    ])

    const userId = (result as any).insertId

    // Create default categories for the new user
    const defaultExpenseCategories = [
      "Food",
      "Transportation",
      "Housing",
      "Entertainment",
      "Utilities",
      "Healthcare",
      "Shopping",
      "Other",
    ]
    const defaultIncomeCategories = ["Salary", "Freelance", "Investments", "Gifts", "Other"]
    const defaultPaymentMethods = ["Cash", "Credit Card", "Debit Card", "Bank Transfer", "Mobile Payment"]

    // Insert default expense categories
    for (const category of defaultExpenseCategories) {
      await db.query("INSERT INTO categories (user_id, name, type) VALUES (?, ?, ?)", [userId, category, "expense"])
    }

    // Insert default income categories
    for (const category of defaultIncomeCategories) {
      await db.query("INSERT INTO categories (user_id, name, type) VALUES (?, ?, ?)", [userId, category, "income"])
    }

    // Insert default payment methods
    for (const method of defaultPaymentMethods) {
      await db.query("INSERT INTO payment_methods (user_id, name) VALUES (?, ?)", [userId, method])
    }

    // Create session
    const sessionId = await createSession(userId)

    // Return user data (excluding sensitive information)
    return NextResponse.json({
      id: userId,
      name,
      email,
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

