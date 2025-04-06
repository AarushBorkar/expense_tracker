import { SignJWT, jwtVerify } from "jose"

// In a real app, this would be an environment variable
const JWT_SECRET = new TextEncoder().encode("your-secret-key")

export async function signJwtToken(payload: any) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d") // 7 days
    .sign(JWT_SECRET)

  return token
}

export async function verifyJwtToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload
  } catch (error) {
    throw new Error("Invalid token")
  }
}

