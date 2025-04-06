import { cookies } from "next/headers"
import { db } from "./db"

// Generate a simple session ID
function generateSessionId() {
  return (
    Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
  )
}

// Create a new session
export async function createSession(userId: number) {
  const sessionId = generateSessionId()
  const expires = new Date()
  expires.setDate(expires.getDate() + 30) // 30 days from now

  try {
    // Delete any existing sessions for this user
    await db.query("DELETE FROM sessions WHERE user_id = ?", [userId])

    // Create new session
    await db.query("INSERT INTO sessions (id, user_id, expires) VALUES (?, ?, ?)", [sessionId, userId, expires])

    // Set cookie
    cookies().set({
      name: "session_id",
      value: sessionId,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: "lax",
    })

    return sessionId
  } catch (error) {
    console.error("Error creating session:", error)
    throw error
  }
}

// Get user from session
export async function getUserFromSession() {
  const sessionId = cookies().get("session_id")?.value

  if (!sessionId) {
    return null
  }

  try {
    // Get session and check if it's expired
    const [sessions] = await db.query("SELECT * FROM sessions WHERE id = ? AND expires > NOW()", [sessionId])

    if (!sessions || (sessions as any[]).length === 0) {
      return null
    }

    const session = (sessions as any[])[0]

    // Get user data
    const [users] = await db.query("SELECT id, name, email FROM users WHERE id = ?", [session.user_id])

    if (!users || (users as any[]).length === 0) {
      return null
    }

    return (users as any[])[0]
  } catch (error) {
    console.error("Error getting user from session:", error)
    return null
  }
}

// Delete session (logout)
export async function deleteSession() {
  const sessionId = cookies().get("session_id")?.value

  if (sessionId) {
    try {
      await db.query("DELETE FROM sessions WHERE id = ?", [sessionId])
    } catch (error) {
      console.error("Error deleting session:", error)
    }
  }

  cookies().set({
    name: "session_id",
    value: "",
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0, // Expire immediately
    sameSite: "lax",
  })
}

