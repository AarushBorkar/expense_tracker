import { getUserFromSession } from "./session"

// Helper function to authenticate requests
export async function authenticate() {
  try {
    const user = await getUserFromSession()
    return user
  } catch (error) {
    console.error("Authentication error:", error)
    return null
  }
}

