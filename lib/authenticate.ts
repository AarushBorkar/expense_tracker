import { cookies } from "next/headers"
import { verifyJwtToken } from "@/lib/jwt"

// Helper function to authenticate requests
export async function authenticate() {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  if (!token) {
    return null
  }

  try {
    const payload = await verifyJwtToken(token)
    return payload
  } catch (error) {
    return null
  }
}

