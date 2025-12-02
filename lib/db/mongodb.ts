import mongoose from "mongoose"

// MongoDB connection configuration
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017"
const MOCK_DB_NAME = process.env.MOCK_DB_NAME || "personal-finance-mock"
const REAL_DB_NAME = process.env.REAL_DB_NAME || "personal-finance"

// Connection state
let mockConnection: mongoose.Connection | null = null
let realConnection: mongoose.Connection | null = null

/**
 * Get connection to mock database
 * Used for development/testing with mock data
 */
export async function connectMockDB(): Promise<mongoose.Connection> {
  if (mockConnection && mockConnection.readyState === 1) {
    return mockConnection
  }

  try {
    // Remove trailing slash from MONGODB_URI if present
    const cleanUri = MONGODB_URI.replace(/\/$/, "")
    const uri = `${cleanUri}/${MOCK_DB_NAME}`
    mockConnection = await mongoose.createConnection(uri).asPromise()
    console.log(`✅ Connected to Mock DB: ${MOCK_DB_NAME}`)
    return mockConnection
  } catch (error) {
    console.error("❌ Error connecting to Mock DB:", error)
    throw error
  }
}

/**
 * Get connection to real database
 * Used for production with actual user data
 */
export async function connectRealDB(): Promise<mongoose.Connection> {
  if (realConnection && realConnection.readyState === 1) {
    return realConnection
  }

  try {
    // Remove trailing slash from MONGODB_URI if present
    const cleanUri = MONGODB_URI.replace(/\/$/, "")
    const uri = `${cleanUri}/${REAL_DB_NAME}`
    realConnection = await mongoose.createConnection(uri).asPromise()
    console.log(`✅ Connected to Real DB: ${REAL_DB_NAME}`)
    return realConnection
  } catch (error) {
    console.error("❌ Error connecting to Real DB:", error)
    throw error
  }
}

/**
 * Get the appropriate database connection based on user role
 * - Regular users: Always use actual database (their own data)
 * - Admin/Dev: Always use mock database (they don't have their own data)
 * @param userRole - User role to determine which database to use
 */
export async function getDBConnection(
  userRole?: "user" | "dev" | "admin"
): Promise<mongoose.Connection> {
  // Regular users always use their own data (actual DB)
  if (userRole === "user") {
    return connectRealDB()
  }

  // Admin/Dev always use mock database (they don't have their own data)
  if (userRole === "admin" || userRole === "dev") {
    return connectMockDB()
  }

  // Fallback to environment variables if no role provided
  const shouldUseMock = process.env.NODE_ENV === "development" || process.env.USE_MOCK_DB === "true"
  
  if (shouldUseMock) {
    return connectMockDB()
  }
  return connectRealDB()
}

/**
 * Close all database connections
 */
export async function closeConnections(): Promise<void> {
  if (mockConnection) {
    await mockConnection.close()
    mockConnection = null
  }
  if (realConnection) {
    await realConnection.close()
    realConnection = null
  }
}

